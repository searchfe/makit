import { Rule } from './rule'
import { Make } from '../make'
import { Logger } from '../utils/logger'
import { Prerequisites, PrerequisitesDeclaration } from './prerequisites'
import { dependencyRecipe, rudeExtname, dynamicPrerequisites } from './rude'
import { Target, TargetDeclaration } from './target'
import { cwd } from 'process'
import { series } from '../schedule'
import { Recipe, RecipeDeclaration } from './recipe'
import { EventEmitter } from 'events'

const defaultRecipe = () => void (0)
const logger = Logger.getOrCreate()

export class Makefile {
    public root: string
    public emitter = new EventEmitter()
    public disableCheckCircular = false

    private ruleMap: Map<TargetDeclaration, Rule> = new Map()
    private fileTargetRules: Map<string, Rule> = new Map()
    private matchingRules: Rule[] = []

    constructor (root = cwd()) {
        this.root = root
    }

    public updateOrAddRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration = [],
        recipeDecl: RecipeDeclaration = defaultRecipe
    ) {
        if (this.ruleMap.has(targetDecl)) {
            this.updateRule(targetDecl, prerequisitesDecl, recipeDecl)
        } else {
            this.addRule(targetDecl, prerequisitesDecl, recipeDecl)
        }
    }

    public addRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration = [],
        recipeDecl: RecipeDeclaration = defaultRecipe
    ) {
        const target = new Target(targetDecl)
        const prerequisites = new Prerequisites(prerequisitesDecl)
        const recipe = new Recipe(recipeDecl)
        const rule = new Rule(target, prerequisites, recipe)
        logger.verbose('RULE', 'adding rule', rule)
        if (target.isFilePath()) {
            this.fileTargetRules.set(target.decl, rule)
        } else {
            this.matchingRules.push(rule)
        }
        this.ruleMap.set(target.decl, rule)
        return rule
    }

    public addRude (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration = [],
        recipeDecl: RecipeDeclaration = defaultRecipe
    ) {
        if (targetDecl instanceof RegExp) throw new Error('rude() for RegExp not supported yet')
        const rule = this.addRule(targetDecl, series(prerequisitesDecl, dynamicPrerequisites()), recipeDecl)
        rule.hasDynamicDependencies = true

        const rude = this.addRule(targetDecl + rudeExtname, prerequisitesDecl, dependencyRecipe)
        rude.isDependencyTarget = true
    }

    public updateRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration = [],
        recipeDecl: RecipeDeclaration = defaultRecipe
    ) {
        const rule = this.ruleMap.get(targetDecl)
        if (!rule) {
            throw new Error(`rule for "${targetDecl}" not found`)
        }
        rule.prerequisites = new Prerequisites(prerequisitesDecl)
        rule.recipe = new Recipe(recipeDecl)
    }

    /**
     * makit 命令入口
     *
     * 命令行调用 makit <target> 由本方法处理，具体的依赖递归解决由 Make 对象处理。
     */
    public async make (target?: string): Promise<Make> {
        logger.resume()
        if (!target) {
            target = this.findFirstTargetOrThrow()
        }
        const make = new Make({
            root: this.root,
            emitter: this.emitter,
            matchRule: target => this.matchRule(target),
            disableCheckCircular: this.disableCheckCircular
        })
        try {
            await make.make(target)
        } catch (err) {
            logger.suspend()
            if (err.target) {
                const chain = make.getGraph().findPathToRoot(err.target)
                const target = chain.shift()
                err.message = `${err.message} while making "${target}"`
                for (const dep of chain) err.message += `\n    required by "${dep}"`
            }
            throw err
        }
        return make
    }

    public on (event: string, fn: (...args: any[]) => void) {
        this.emitter.on(event, fn)
    }
    public off (event: string, fn: (...args: any[]) => void) {
        this.emitter.removeListener(event, fn)
    }

    private matchRule (target: string): [Rule, RegExpExecArray] | null {
        if (this.fileTargetRules.has(target)) {
            const match: RegExpExecArray = [target] as RegExpExecArray
            match.input = target
            match.index = 0
            return [this.fileTargetRules.get(target)!, match]
        }
        for (let i = this.matchingRules.length - 1; i >= 0; i--) {
            const rule = this.matchingRules[i]
            const match = rule.match(target)
            if (match) {
                return [rule, match]
            }
        }
        return null
    }

    private findFirstTarget (): string {
        return this.fileTargetRules.keys().next().value
    }

    private findFirstTargetOrThrow () {
        const target = this.findFirstTarget()
        if (!target) throw new Error('target not found')
        return target
    }
}
