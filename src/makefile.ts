import { Rule, prerequisitesDeclaration } from './rule'
import { Context } from './context'
import { cwd } from 'process'
import { Recipe, recipeDeclaration } from './recipe'
import { resolve } from 'path'
import { stat } from 'fs-extra'

const defaultRecipe = () => void (0)

export class Makefile {
    public root: string

    private ruleMap: Map<string, Rule> = new Map()
    private ruleList: Rule[] = []
    private making: Map<string, Promise<string>> = new Map()

    constructor (root?) {
        this.root = root || cwd()
    }

    public addRule (
        target: string,
        prerequisites: prerequisitesDeclaration,
        recipe: recipeDeclaration = defaultRecipe
    ) {
        const rule = new Rule(target, prerequisites, new Recipe(recipe, this.root))
        this.ruleMap.set(target, rule)
        this.ruleList.push(rule)
    }

    public async make (target?: string): Promise<string> {
        if (!target) {
            target = this.findFirstTargetOrThrow()
        }
        if (this.making.has(target)) {
            return this.making.get(target)
        }
        const pending = this.doMake(target)
        this.making.set(target, pending)
        return pending
    }

    public async doMake (target: string): Promise<string> {
        const rule = this.findRule(target)

        if (rule) {
            const context = new Context({ target, root: this.root })
            context.dependencies = await rule.getPrerequisites(context)
            await Promise.all(context.dependencies.map(dep => this.make(dep)))

            if (await this.isValid(target, context.dependencies)) {
                return target
            }
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

    private findRule (target: string) {
        if (this.ruleMap.has(target)) {
            return this.ruleMap.get(target)
        }
        for (let i = this.ruleList.length - 1; i >= 0; i--) {
            const rule = this.ruleList[i]
            if (rule.match(target)) {
                return rule
            }
        }
    }

    private findFirstTarget () {
        for (const rule of this.ruleList) {
            if (!rule.isGlob) return rule.target
        }
    }

    private findFirstTargetOrThrow () {
        const target = this.findFirstTarget()
        if (!target) throw new Error('target not found')
        return target
    }
}
