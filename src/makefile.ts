import { Rule } from './rule'
import { Prerequisites, PrerequisitesDeclaration } from './prerequisites'
import { Target, TargetDeclaration } from './target'
import chalk from 'chalk'
import { Context } from './context'
import { cwd } from 'process'
import { DirectedGraph } from './graph'
import { Recipe, RecipeDeclaration } from './recipe'
import { resolve } from 'path'
import { stat } from 'fs-extra'

const defaultRecipe = () => void (0)

export class Makefile {
    public root: string
    public verbose: boolean

    private fileTargetRules: Map<string, Rule> = new Map()
    private ruleMap: Map<TargetDeclaration, Rule> = new Map()
    private ruleList: Rule[] = []
    private making: Map<string, Promise<string>> = new Map()
    private graph: DirectedGraph<string> = new DirectedGraph()

    constructor (root = cwd(), verbose = false) {
        this.root = root
        this.verbose = verbose
    }

    public addRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration,
        recipeDecl: RecipeDeclaration<void> = defaultRecipe
    ) {
        const target = new Target(targetDecl)
        const prerequisites = new Prerequisites(prerequisitesDecl)
        const recipe = new Recipe(recipeDecl)
        const rule = new Rule(target, prerequisites, recipe)
        if (target.isFilePath()) {
            this.fileTargetRules.set(target.decl, rule)
        }
        this.ruleList.push(rule)
        this.ruleMap.set(target.decl, rule)
    }

    public updateRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration,
        recipeDecl: RecipeDeclaration<void> = defaultRecipe
    ) {
        if (!this.ruleMap.has(targetDecl)) {
            throw new Error('error while updating rule: not found')
        }
        const rule = this.ruleMap.get(targetDecl)
        rule.prerequisites = new Prerequisites(prerequisitesDecl)
        rule.recipe = new Recipe(recipeDecl)
    }

    public async make (target?: string, parent?: string): Promise<string> {
        if (!target) {
            target = this.findFirstTargetOrThrow()
        }

        if (parent) this.graph.addEdge(parent, target)
        else this.graph.addVertex(target)

        const circle = this.graph.checkCircular(target)
        if (circle) {
            throw new Error(`Circular detected while making "${target}": ${circle.join(' <- ')}`)
        }

        const fullPath = resolve(this.root, target)
        if (this.making.has(fullPath)) {
            return this.making.get(fullPath)
        }
        const pending = this.doMake(target)
        this.making.set(fullPath, pending)
        return pending
    }

    public invalidate (path: string) {
        const fullpath = resolve(path)
        this.making.delete(fullpath)
    }

    public printGraph () {
        console.log(chalk['cyan']('deps'))
        console.log(this.graph.toString())
    }

    private async doMake (target: string): Promise<string> {
        const [rule, match] = this.findRule(target)

        if (rule) {
            const context = new Context({ target, match, root: this.root })
            context.dependencies = await rule.dependencies(context)
            await Promise.all(context.dependencies.map(dep => this.make(dep, target)))

            if (await this.isValid(target, context.dependencies)) {
                this.verbose && console.log(chalk['grey']('skip'), `${target} up to date`)
                return target
            }
            this.verbose && console.log(chalk['cyan'](`make`), this.graph.getSinglePath(target).join(' <- '))
            await rule.recipe.make(context)
        } else {
            if (await this.isValid(target, [])) return target
            throw new Error(`no rule matched target: "${target}"`)
        }

        return target
    }

    private async isValid (target: string, deps: string[]) {
        const targetInfo = await this.getFileStat(target)
        const depInfos = await Promise.all(deps.map(dep => this.getFileStat(dep)))
        if (!targetInfo) return false

        for (const depInfo of depInfos) {
            if (depInfo.mtime > targetInfo.mtime) return false
        }
        return true
    }

    private getFileStat (file: string) {
        const filepath = resolve(this.root, file)
        return stat(filepath).catch(() => null)
    }

    private findRule (target: string): [Rule, RegExpExecArray] {
        if (this.fileTargetRules.has(target)) {
            const match: RegExpExecArray = [target] as RegExpExecArray
            match.input = target
            match.index = 0
            return [this.fileTargetRules.get(target), match]
        }
        for (let i = this.ruleList.length - 1; i >= 0; i--) {
            const rule = this.ruleList[i]
            const match = rule.match(target)
            if (match) {
                return [rule, match]
            }
        }
        return [null, null]
    }

    private findFirstTarget (): string {
        for (const rule of this.ruleList) {
            if (rule.target.isFilePath()) return rule.target.decl
        }
    }

    private findFirstTargetOrThrow () {
        const target = this.findFirstTarget()
        if (!target) throw new Error('target not found')
        return target
    }
}
