import { Context } from './context'
import { relation } from './utils/number'
import { IO } from './io'
import { MTIME_EMPTY_DEPENDENCY } from './fs/mtime'
import { TimeStamp } from './fs/time-stamp'
import { max } from 'lodash'
import { Rule } from './models/rule'
import { getTargetFromDependency } from './models/rude'
import chalk from 'chalk'
import { DirectedGraph } from './utils/graph'
import { Logger, hlTarget } from './utils/logger'
import { EventEmitter } from 'events'

const l = Logger.getOrCreate()

export interface MakeOptions {
    root?: string
    emitter: EventEmitter
    disableCheckCircular?: boolean
    matchRule: (target: string) => [Rule, RegExpExecArray] | null
}

export class Make {
    private making: Map<string, Promise<TimeStamp>> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()
    private root: string
    private matchRule: (target: string) => [Rule, RegExpExecArray] | null
    private emitter: EventEmitter
    private disableCheckCircular: boolean

    constructor ({
        root = process.cwd(),
        matchRule,
        emitter,
        disableCheckCircular
    }: MakeOptions) {
        this.root = root
        this.matchRule = matchRule
        this.emitter = emitter
        this.disableCheckCircular = disableCheckCircular || false
    }

    public createContext ({ target, match, rule }: { target: string, match: RegExpExecArray | null, rule?: Rule}) {
        if (rule && rule.isDependencyTarget) {
            target = getTargetFromDependency(target)
            match = this.matchRule(target)![1]
        }
        return new Context({
            target,
            match,
            fs: IO.getFileSystem(),
            root: this.root,
            make: (child: string) => this.make(child, target)
        })
    }

    public async make (target: string, parent?: string): Promise<TimeStamp> {
        if (parent) this.graph.addEdge(parent, target)
        else this.graph.addVertex(target)

        this.checkCircular(target)

        return this
            .withCache(target, () => this.doMake(target, parent).catch(err => {
                if (err.makeStack) {
                    err.makeStack.push(target)
                } else {
                    err.makeStack = []
                    err.target = target
                }
                throw err
            }))
    }

    private async doMake (target: string, parent?: string): Promise<TimeStamp> {
        this.emit('making', { target, parent, graph: this.graph })
        l.verbose('PREP', hlTarget(target))
        const result = this.matchRule(target)
        if (result) {
            l.debug('RULE', hlTarget(target), 'rule found:', result[0])
        } else {
            l.debug('RULE', hlTarget(target), 'rule not found')
        }
        const [rule, match] = result || [undefined, null]
        const context = this.createContext({ target, match, rule })
        const fullpath = context.toFullPath(target)
        const [dmtime, mtime] = await Promise.all([
            this.resolveDependencies(target, context, rule),
            IO.getMTime().getModifiedTime(fullpath)
        ])

        l.debug('TIME', hlTarget(target), () => `mtime(${mtime}) ${relation(mtime, dmtime)} dmtime(${dmtime})`)

        // non-existing files have the same mtime(-2
        if (dmtime >= mtime) {
            if (!rule) throw new Error(`no rule matched target: "${target}"`)
            l.info('MAKE', () => this.makeDetail(target, context))
            await rule.recipe.make(context)
            if (rule.hasDynamicDependencies) await context.writeDependency()
            this.emit('maked', { target, parent, graph: this.graph })
            return IO.getMTime().setModifiedTime(fullpath)
        }

        l.info(chalk.grey('SKIP'), () => this.makeDetail(target, context))
        this.emit('skip', { target, parent, graph: this.graph })

        return mtime
    }

    private makeDetail (target: string, context: Context) {
        const deps = [
            ...context.dependencies,
            ...context.dynamicDependencies.map(dep => `${dep}(dynamic)`)
        ]
        return hlTarget(target) + ': ' + deps.join(', ')
    }

    private emit (event: string, msg: any) {
        this.emitter && this.emitter.emit(event, msg)
    }

    private async resolveDependencies (target: string, context: Context, rule?: Rule): Promise<TimeStamp> {
        if (!rule) return MTIME_EMPTY_DEPENDENCY
        const results = await rule.map(
            context,
            (dep: string) => this.make(dep, target)
        )
        l.debug('TIME', hlTarget(target), () => 'dependencies: ' +
            context.dependencies.map((dep, i) => `${dep}(${results[i]})`)
        )
        return max(results) || MTIME_EMPTY_DEPENDENCY
    }

    private checkCircular (begin: string) {
        if (this.disableCheckCircular) {
            return
        }
        const circle = this.graph.checkCircular(begin)
        if (circle) {
            throw new Error(`Circular detected: ${circle.join(' -> ')}`)
        }
    }

    public getGraph () {
        return this.graph
    }

    private withCache<T> (target: string, fn: () => Promise<TimeStamp>): Promise<TimeStamp> {
        if (!this.making.has(target)) {
            this.making.set(target, fn())
        }
        return this.making.get(target)!
    }
}
