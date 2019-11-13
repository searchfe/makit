import { Rule, TargetType, TargetDeclaration, PrerequisitesDeclaration } from './rule'
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
        target: TargetDeclaration,
        prerequisites: PrerequisitesDeclaration,
        recipe: recipeDeclaration = defaultRecipe
    ) {
        const rule = new Rule(target, prerequisites, new Recipe(recipe, this.root))
        if (rule.targetIsFilePath()) {
            this.ruleMap.set(rule.target, rule)
        }
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

    private async doMake (target: string): Promise<string> {
        const [rule, match] = this.findRule(target)

        if (rule) {
            const context = new Context({ target, match, root: this.root })
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

    private findRule (target: string): [Rule, RegExpExecArray] {
        if (this.ruleMap.has(target)) {
            const match: RegExpExecArray = [target] as RegExpExecArray
            match.input = target
            match.index = 0
            return [this.ruleMap.get(target), match]
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
            if (rule.targetIsFilePath()) return rule.target
        }
    }

    private findFirstTargetOrThrow () {
        const target = this.findFirstTarget()
        if (!target) throw new Error('target not found')
        return target
    }
}
