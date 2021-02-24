import { Task } from './task'
import { relation } from './utils/number'
import { IO } from './io'
import { MTIME_EMPTY_DEPENDENCY } from './fs/mtime'
import { TimeStamp } from './fs/time-stamp'
import { Rule } from './models/rule'
import { isRudeDependencyFile } from './models/rude'
import { DirectedGraph } from './utils/graph'
import { LogLevel, Logger, hlTarget } from './utils/logger'
import { Reporter } from './reporters/reporter'

const l = Logger.getOrCreate()

export interface MakeOptions {
    root?: string
    reporter: Reporter
    disableCheckCircular?: boolean
    matchRule: (target: string) => [Rule, RegExpExecArray] | null
}

/**
 * 一个 Make 对象表示一次 make
 * 每次 make 的入口 target 是唯一的，其依赖图是一个有序图，用 checkCircular 来确保这一点
 */
export class Make {
    public dependencyGraph: DirectedGraph<string> = new DirectedGraph()

    private tasks: Map<string, Task> = new Map()
    private root: string
    private matchRule: (target: string) => [Rule, RegExpExecArray] | null
    private reporter: Reporter
    private disableCheckCircular: boolean
    private isMaking = false
    // ES Set 是有序集合（按照 add 顺序），在此用作队列顺便帮助去重
    private targetQueue: Set<string> = new Set()

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

    public async make (target: string, parent?: string): Promise<TimeStamp> {
        this.buildDependencyGraph(target, parent)
        for (const node of this.dependencyGraph.preOrder(target)) {
            if (this.tasks.get(node)!.isReady()) this.targetQueue.add(node)
        }
        l.verbose('GRAF', '0-indegree:', this.targetQueue)
        return new Promise((resolve, reject) => {
            const task = this.tasks.get(target)!
            task.addPromise(resolve, reject)
            this.startMake()
        })
    }

    private startMake () {
        if (this.isMaking) return
        this.isMaking = true

        for (const target of this.targetQueue) {
            this.doMake(target)
                .then(() => {
                    this.tasks.get(target)!.resolve()
                    this.notifyDependants(target)
                })
                .catch((err) => {
                    // 让 target 以及依赖 target 的目标对应的 make promise 失败
                    const dependants = this.dependencyGraph.getAncestors(target)
                    err['target'] = target
                    for (const dependant of dependants) {
                        this.tasks.get(dependant)!.reject(err)
                    }
                })
        }
        this.targetQueue = new Set()
        this.isMaking = false
    }

    public invalidate(target: string) {
        const targetTask = this.tasks.get(target)

        // 还没编译到这个文件，或者这个文件根本不在依赖树里
        if (!targetTask) return

        // 更新它的时间（用严格递增的虚拟时间来替代文件系统时间）
        targetTask.updateMtime()

        const queue = new Set<Task>([targetTask])
        for (const node of queue) {
            node.reset()
            for (const parent of this.dependencyGraph.getParents(node.target)) {
                const ptask = this.tasks.get(parent)!
                ptask.pendingDependencyCount++
                queue.add(ptask)
            }
        }
        this.targetQueue.add(target)
        this.startMake()
    }

    private buildDependencyGraph (node: string, parent?: string) {
        l.verbose('GRAF', 'node:', node, 'parent:', parent)
        this.dependencyGraph.addVertex(node)
        if (parent && !this.dependencyGraph.hasEdge(parent, node)) {
            this.dependencyGraph.addEdge(parent, node)
            if (!this.tasks.has(node) || !this.tasks.get(node)!.isFinished()) {
                this.tasks.get(parent)!.pendingDependencyCount++
            }
        }
        if (!this.disableCheckCircular) this.dependencyGraph.checkCircular(node)
        if (this.tasks.has(node)) return

        const result = this.matchRule(node)
        const [rule, match] = result || [undefined, null]

        const task = this.createTask({ target: node, match, rule })
        this.tasks.set(node, task)

        l.debug('DEPS', hlTarget(node), task.getDependencies())
        for (const dep of task.getDependencies()) this.buildDependencyGraph(dep, node)
    }

    private async doMake (target: string) {
        const task = this.tasks.get(target)!
        task.start()
        this.reporter.make(task)

        let dmtime = MTIME_EMPTY_DEPENDENCY
        for (const dep of this.dependencyGraph.getChildren(target)) {
            dmtime = Math.max(dmtime, this.tasks.get(dep)!.mtime!)
        }

        l.debug('TIME', hlTarget(target), () => `mtime(${task.mtime}) ${relation(task.mtime, dmtime)} dmtime(${dmtime})`)

        if (dmtime < task.mtime) {
            this.reporter.skip(task)
        } else {
            if (!task.rule) throw new Error(`no rule matched target: "${target}"`)
            await task.rule.recipe.make(task.ctx)
            if (task.rule.hasDynamicDependencies) await task.writeDependency()
            await task.updateMtime()
            this.reporter.made(task)
        }
    }

    private notifyDependants (target: string) {
        for (const dependant of this.dependencyGraph.getParents(target)) {
            const dependantTask = this.tasks.get(dependant)!
            --dependantTask.pendingDependencyCount
            if (dependantTask.isReady()) {
                this.targetQueue.add(dependant)
                this.startMake()
            }
        }
    }

    private createTask ({ target, match, rule }: { target: string, match: RegExpExecArray | null, rule?: Rule}) {
        return Task.create({
            target,
            match,
            fs: IO.getFileSystem(),
            root: this.root,
            rule,
            make: (child: string) => this.make(child, target)
        })
    }
}
