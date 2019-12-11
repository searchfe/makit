import { Context } from './context'
import { IO } from './io'
import { TimeStamp, EMPTY_DEPENDENCY } from './mtime'
import { max } from 'lodash'
import { Rule } from './rule'
import { getTargetFromDependency } from './rude'
import chalk from 'chalk'
import { DirectedGraph } from './graph'
import { Logger } from './utils/logger'
import { EventEmitter } from 'events'

const logger = Logger.getOrCreate()

export interface MakeOptions {
    root?: string
    emitter?: EventEmitter
    disableCheckCircular?: boolean
    matchRule?: (target: string) => [Rule, RegExpExecArray]
}

export class Make {
    private making: Map<string, Promise<TimeStamp>> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()
    private root: string
    private matchRule: (target: string) => [Rule, RegExpExecArray]
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

    public createContext ({ target, match, rule }: { target: string, match: RegExpExecArray, rule?: Rule}) {
        if (rule && rule.isDependencyTarget) {
            target = getTargetFromDependency(target)
            match = this.matchRule(target)[1]
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
        this.updateGraph(target, parent)
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
        logger.verbose('prepare', target)
        const [rule, match] = this.matchRule(target)
        const context = this.createContext({ target, match, rule })
        const fullpath = context.toFullPath(target)
        const [dmtime, mtime] = await Promise.all([
            this.resolveDependencies(target, context, rule),
            IO.getMTime().getModifiedTime(fullpath)
        ])

        logger.debug(target, `mtime(${mtime}) - dmtime(${dmtime}) = ${mtime - dmtime}`)

        // non-existing files have the same mtime(-2
        if (dmtime >= mtime) {
            if (!rule) throw new Error(`no rule matched target: "${target}"`)
            logger.info('make', this.makeDetail(target, context))
            await rule.recipe.make(context)
            if (rule.hasDynamicDependencies) await context.writeDependency()
            this.emit('maked', { target, parent, graph: this.graph })
            return IO.getMTime().setModifiedTime(fullpath)
        }

        logger.info(chalk['grey']('skip'), this.makeDetail(target, context))
        this.emit('skip', { target, parent, graph: this.graph })

        return mtime
    }

    private makeDetail (target: string, context: Context) {
        const deps = context.getAllDependencies()
        const msg = target + (deps.length ? ': ' + deps.join(', ') : '')
        return msg
    }

    private emit (event: string, msg: any) {
        this.emitter && this.emitter.emit(event, msg)
    }

    private async resolveDependencies (target: string, context: Context, rule: Rule): Promise<TimeStamp> {
        if (!rule) return EMPTY_DEPENDENCY
        const results = await rule.map(
            context,
            (dep: string) => this.make(dep, target)
        )
        logger.debug(target, 'dependencies', context.dependencies)
        logger.debug(target, 'timestamps', results)
        return max(results) || EMPTY_DEPENDENCY
    }

    private updateGraph (target: string, parent?: string) {
        if (parent) this.graph.addEdge(parent, target)
        else this.graph.addVertex(target)
    }

    private checkCircular (begin: string) {
        if (this.disableCheckCircular) {
            return
        }
        const circle = this.graph.checkCircular(begin)
        if (circle) {
            throw new Error(`Circular detected: ${circle.join(' <- ')}`)
        }
    }

    public getGraph () {
        return this.graph.toString()
    }

    private withCache (target: string, fn: (...args: any[]) => Promise<TimeStamp>): Promise<TimeStamp> {
        if (!this.making.has(target)) {
            this.making.set(target, fn())
        }
        return this.making.get(target)
    }
}
