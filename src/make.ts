import { Context } from './context'
import { Rule } from './rule'
import { resolve } from 'path'
import { stat } from 'fs-extra'
import chalk from 'chalk'
import { DirectedGraph } from './graph'
import { Logger } from './utils/logger'

export class Make {
    private making: Map<string, Promise<boolean>> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()
    private root: string
    private ruleResolver: (target: string) => [Rule, RegExpExecArray]
    private logger: Logger

    constructor (root: string, logger: Logger, ruleResolver: (target: string) => [Rule, RegExpExecArray]) {
        this.root = root
        this.ruleResolver = ruleResolver
        this.logger = logger
    }

    public async make (target: string, parent?: string): Promise<boolean> {
        this.updateGraph(target, parent)
        this.checkCircular(target)

        return this.withCache(target, async () => {
            const [rule, match] = this.ruleResolver(target)

            if (!rule) {
                if (await this.isValid(target, [])) return false
                throw new Error(`no rule matched target: "${target}"`)
            }
            return this.doMake(target, rule, match)
        })
    }

    private async doMake (target: string, rule: Rule, match: RegExpExecArray): Promise<boolean> {
        const context = new Context({ target, match, root: this.root })
        context.dependencies = await rule.dependencies(context)
        await Promise.all(context.dependencies.map(dep => this.make(dep, target)))

        if (await this.isValid(target, context.dependencies)) {
            this.logger.verbose(chalk['grey']('skip'), `${target} up to date`)
            return false
        }
        this.logger.verbose(chalk['cyan'](`make`), this.graph.getSinglePath(target).join(' <- '))
        await rule.recipe.make(context)
        return true
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
    private getFileStat (file: string) {
        const filepath = resolve(this.root, file)
        return stat(filepath).catch(() => null)
    }

    private withCache (target: string, fn: (...args: any[]) => Promise<boolean>): Promise<boolean> {
        if (!this.making.has(target)) {
            this.making.set(target, fn())
        }
        return this.making.get(target)
    }

    private async isValid (target: string, deps: string[]) {
        const targetInfo = await this.getFileStat(target)
        const depInfos = await Promise.all(deps.map(dep => this.getFileStat(dep)))
        if (!targetInfo) return false

        for (const depInfo of depInfos) {
            if (!depInfo || depInfo.mtime > targetInfo.mtime) return false
        }
        return true
    }
}
