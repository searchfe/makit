import { Target } from './target'
import { relation } from './utils/number'
import { IO } from './io'
import { MTIME_EMPTY_DEPENDENCY } from './fs/mtime'
import { TimeStamp } from './fs/time-stamp'
import { Rule } from './makefile/rule'
import { isRudeDependencyFile } from './makefile/rude'
import { Queue } from './utils/queue'
import { Task } from './task'
import { DirectedGraph } from './utils/graph'
import { LogLevel, Logger, hlTarget } from './utils/logger'
import { Reporter } from './reporters/reporter'

const l = Logger.getOrCreate()

export interface MakeOptions {
    root?: string;
    reporter: Reporter;
    disableCheckCircular?: boolean;
    matchRule: (target: string) => [Rule, RegExpExecArray] | null;
}

/**
 * 一个 Make 对象表示一次 make
 * 每次 make 的入口 target 是唯一的，其依赖图是一个有序图，用 checkCircular 来确保这一点
 */
export class Make {
    public dependencyGraph: DirectedGraph<string> = new DirectedGraph()

    private targets: Map<string, Target> = new Map()
    private tasks: Map<string, Task> = new Map()
    private root: string
    private matchRule: (target: string) => [Rule, RegExpExecArray] | null
    private reporter: Reporter
    private disableCheckCircular: boolean
    private isMaking = false
    // ES Set 是有序集合（按照 add 顺序），在此用作队列顺便帮助去重
    private targetQueue: Queue<Task> = new Queue()

    constructor ({
        root = process.cwd(),
        matchRule,
        disableCheckCircular,
        reporter
    }: MakeOptions) {
        this.root = root
        this.matchRule = matchRule
        this.reporter = reporter
        this.disableCheckCircular = disableCheckCircular || false
    }

    public async make (targetName: string, parent?: string): Promise<TimeStamp> {
        this.buildDependencyGraph(targetName, parent)
        for (const node of this.dependencyGraph.preOrder(targetName)) {
            const target = this.targets.get(node)!
            if (target.isReady()) this.scheduleTask(target)
        }
        l.verbose('GRAF', '0-indegree:', this.targetQueue)
        return new Promise((resolve, reject) => {
            const target = this.targets.get(targetName)!
            target.addPromise(resolve, reject)
            this.startMake()
        })
    }

    private startMake () {
        if (this.isMaking) return
        this.isMaking = true

        while (this.targetQueue.size) {
            const task = this.targetQueue.pop()!
            if (task.isCanceled()) continue

            this.doMake(task.target)
                .then(() => {
                    if (task.isCanceled()) return
                    task.target.resolve()
                    this.notifyDependants(task.target.name)
                })
                .catch((err) => {
                    if (task.isCanceled()) return
                    // 让 target 以及依赖 target 的目标对应的 make promise 失败
                    const dependants = this.dependencyGraph.getInVerticesRecursively(task.target.name)
                    err['target'] = task.target.name
                    for (const dependant of dependants) {
                        this.targets.get(dependant)!.reject(err)
                    }
                })
        }
        this.isMaking = false
    }

    public invalidate (targetName: string) {
        const target = this.targets.get(targetName)

        // 还没编译到这个文件，或者这个文件根本不在依赖树里
        if (!target) return

        // 更新它的时间（用严格递增的虚拟时间来替代文件系统时间）
        target.updateMtime()

        const queue = new Set<Target>([target])
        for (const node of queue) {
            for (const parent of this.dependencyGraph.getInVertices(node.name)) {
                const ptarget = this.targets.get(parent)!
                // 已经成功 make，意味着 parent 对 node 的依赖已经移除
                // 注意：不可用 isFinished，因为 isRejected() 的情况依赖并未移除
                if (node.isResolved()) ptarget.pendingDependencyCount++
                queue.add(ptarget)
            }
            node.reset()
        }
        this.scheduleTask(target)
        this.startMake()
    }

    private buildDependencyGraph (node: string, parent?: string) {
        l.verbose('GRAF', 'node:', node, 'parent:', parent)
        this.dependencyGraph.addVertex(node)

        // 边 (parent, node) 不存在时才添加
        if (parent && !this.dependencyGraph.hasEdge(parent, node)) {
            this.dependencyGraph.addEdge(parent, node)
            if (!this.isResolved(node)) {
                this.targets.get(parent)!.pendingDependencyCount++
            }
        }
        if (!this.disableCheckCircular) this.dependencyGraph.checkCircular(node)
        if (this.targets.has(node)) return

        const result = this.matchRule(node)
        const [rule, match] = result || [undefined, null]

        const target = this.createTarget({ target: node, match, rule })
        this.targets.set(node, target)

        l.debug('DEPS', hlTarget(node), target.getDependencies())
        for (const dep of target.getDependencies()) this.buildDependencyGraph(dep, node)
    }

    private isResolved (targetName: string) {
        const target = this.targets.get(targetName)
        return target && target.isResolved()
    }

    private async doMake (target: Target) {
        target.start()
        this.reporter.make(target)

        let dmtime = MTIME_EMPTY_DEPENDENCY
        for (const dep of this.dependencyGraph.getOutVerticies(target.name)) {
            dmtime = Math.max(dmtime, this.targets.get(dep)!.mtime!)
        }

        l.debug('TIME', hlTarget(target.name), () => `mtime(${target.mtime}) ${relation(target.mtime, dmtime)} dmtime(${dmtime})`)

        if (dmtime < target.mtime) {
            this.reporter.skip(target)
        } else {
            if (!target.rule) throw new Error(`no rule matched target: "${target.name}"`)
            await target.rule.recipe.make(target.ctx)
            if (target.rule.hasDynamicDependencies) await target.writeDependency()
            await target.updateMtime()
            this.reporter.made(target)
        }
    }

    private notifyDependants (targetName: string) {
        for (const dependant of this.dependencyGraph.getInVertices(targetName)) {
            const dependantTarget = this.targets.get(dependant)!
            --dependantTarget.pendingDependencyCount
            if (dependantTarget.isReady()) {
                this.scheduleTask(dependantTarget)
                this.startMake()
            }
        }
    }

    private scheduleTask (target: Target) {
        const task = new Task(target)
        if (this.tasks.has(target.name)) {
            this.tasks.get(target.name)!.cancel()
        }
        this.tasks.set(target.name, task)
        this.targetQueue.push(task)
    }

    private createTarget ({ target, match, rule }: { target: string; match: RegExpExecArray | null; rule?: Rule}) {
        return Target.create({
            target,
            match,
            fs: IO.getFileSystem(),
            root: this.root,
            rule,
            make: (child: string) => this.make(child, target)
        })
    }
}
