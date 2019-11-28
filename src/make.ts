import { Context } from './context'
import { now } from './utils/date'
import { fromCallback } from './utils/promise'
import { max } from 'lodash'
import { Rule } from './rule'
import { FileSystem } from './utils/fs'
import chalk from 'chalk'
import { DirectedGraph } from './graph'
import { Logger } from './utils/logger'

export type MakeResult = Number
export type PendingMakeResult = Promise<MakeResult>

// NOT_EXIST < EMPTY_DEPENDENCY < mtime < Date.now()
const NOT_EXIST: MakeResult = -2
const EMPTY_DEPENDENCY: MakeResult = -1

export interface MakeOptions {
    root?: string
    logger?: Logger
    fs?: FileSystem
    ruleResolver: (target: string) => [Rule, RegExpExecArray]
}

export class Make {
    private making: Map<string, PendingMakeResult> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()
    private root: string
    private ruleResolver: (target: string) => [Rule, RegExpExecArray]
    private logger: Logger
    private fs: FileSystem

    constructor ({
        root = process.cwd(),
        logger = new Logger(false),
        fs = require('fs'),
        ruleResolver
    }: MakeOptions) {
        this.fs = fs
        this.root = root
        this.ruleResolver = ruleResolver
        this.logger = logger
    }

    public async make (target: string, parent?: string): PendingMakeResult {
        this.updateGraph(target, parent)
        this.checkCircular(target)

        return this.withCache(target, async () => {
            const [rule, match] = this.ruleResolver(target)
            const context = new Context({ fs: this.fs, target, match, root: this.root })
            const [dmtime, mtime] = await Promise.all([
                this.resolveDependencies(context, rule),
                this.getModifiedTime(context.targetFullPath())
            ])

            if (dmtime >= mtime) {
                // depency mtime may equal mtime when no io and async
                if (!rule) {
                    throw new Error(`no rule matched target: "${target}"`)
                }
                this.logger.verbose(chalk['cyan'](`make`), this.graph.getSinglePath(target).join(' <- '))
                await rule.recipe.make(context)
                return now()
            }
            this.logger.verbose(chalk['grey']('skip'), `${target} up to date`)
            return mtime
        })
    }

    private async getModifiedTime (filepath: string) {
        try {
            const { mtime } = await fromCallback(cb => this.fs.stat(filepath, cb))
            return +mtime
        } catch (error) {
            if (error.code === 'ENOENT') return NOT_EXIST
            throw error
        }
    }

    private async resolveDependencies (context: Context, rule?: Rule): PendingMakeResult {
        if (!rule) return EMPTY_DEPENDENCY
        const dependencies = await rule.dependencies(context)
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

    private withCache (target: string, fn: (...args: any[]) => PendingMakeResult): PendingMakeResult {
        if (!this.making.has(target)) {
            this.making.set(target, fn())
        }
        return this.making.get(target)
    }
}
