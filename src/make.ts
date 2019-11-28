import { Context } from './context'
import { TimeStamp } from './utils/date'
import { fromCallback } from './utils/promise'
import { max } from 'lodash'
import { Rule } from './rule'
import { FileSystem } from './utils/fs'
import chalk from 'chalk'
import { DirectedGraph } from './graph'
import { Logger } from './utils/logger'
import { EventEmitter } from 'events'

// NOT_EXIST < EMPTY_DEPENDENCY < mtimeNs < Date.now()
const NOT_EXIST: TimeStamp = -2
const EMPTY_DEPENDENCY: TimeStamp = -1

export interface MakeOptions {
    root?: string
    logger?: Logger
    fs?: FileSystem
    emitter?: EventEmitter
    ruleResolver: (target: string) => [Rule, RegExpExecArray]
}

export class Make {
    private making: Map<string, Promise<TimeStamp>> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()
    private root: string
    private ruleResolver: (target: string) => [Rule, RegExpExecArray]
    private logger: Logger
    private fs: FileSystem
    private emitter: EventEmitter;

    constructor ({
        root = process.cwd(),
        logger = new Logger(false),
        fs = require('fs'),
        ruleResolver,
        emitter
    }: MakeOptions) {
        this.fs = fs
        this.root = root
        this.ruleResolver = ruleResolver
        this.logger = logger
        this.emitter = emitter
    }

    public async make (target: string, parent?: string): Promise<TimeStamp> {
        this.emitter && this.emitter.emit('prepare', { target, parent })
        this.updateGraph(target, parent)
        this.checkCircular(target)

        return this.withCache(target, async (): Promise<TimeStamp> => {
            const [rule, match] = this.ruleResolver(target)
            const context = new Context({
                fs: this.fs,
                target,
                match,
                rule,
                root: this.root,
                make: (child: string) => {
                    rule.prerequisites.addDynamicDependency(target, child)
                    return this.make(child, target)
                }
            })
            const [dmtime, mtime] = await Promise.all([
                this.resolveDependencies(context),
                this.getModifiedTime(context.targetFullPath())
            ])

            if (dmtime >= mtime) {
                // depency mtime may equal to mtime when no io and async
                if (!rule) {
                    throw new Error(`no rule matched target: "${target}"`)
                }
                this.logger.verbose(chalk['cyan'](`make`), this.graph.getSinglePath(target).join(' <- '))
                rule.prerequisites.clearDynamicDependency(target)
                const t = await rule.recipe.make(context)
                this.emitter && this.emitter.emit('make', { target, parent })
                return t
            }
            this.logger.verbose(chalk['grey']('skip'), `${target} up to date`)
            this.emitter && this.emitter.emit('skip', { target, parent })
            return mtime
        })
    }

    private async getModifiedTime (filepath: string): Promise<TimeStamp> {
        try {
            const { mtimeMs } = await fromCallback(cb => this.fs.stat(filepath, cb))
            return mtimeMs
        } catch (error) {
            if (error.code === 'ENOENT') return NOT_EXIST
            throw error
        }
    }

    private async resolveDependencies (context: Context): Promise<TimeStamp> {
        if (!context.rule) return EMPTY_DEPENDENCY
        const dependencies = await context.rule.getDependencies(context)
        const results = await Promise.all(dependencies.map(dep => this.make(dep, context.target)))
        return max(results) || EMPTY_DEPENDENCY
    }

    private updateGraph (target: string, parent?: string) {
        if (parent) this.graph.addEdge(parent, target)
        else this.graph.addVertex(target)
    }

    private checkCircular (begin: string) {
        const circle = this.graph.checkCircular(begin)
        if (circle) {
            throw new Error(`Circular detected while making "${begin}": ${circle.join(' <- ')}`)
        }
    }

    public printGraph () {
        console.log(chalk['cyan']('deps'))
        console.log(this.graph.toString())
    }

    private withCache (target: string, fn: (...args: any[]) => Promise<TimeStamp>): Promise<TimeStamp> {
        if (!this.making.has(target)) {
            this.making.set(target, fn())
        }
        return this.making.get(target)
    }
}
