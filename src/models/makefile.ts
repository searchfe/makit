import { Rule } from './rule'
import { Make } from '../make'
import { Logger } from '../utils/logger'
import { Prerequisites, PrerequisitesDeclaration } from './prerequisites'
import { getDependencyFromTarget, clearDynamicDependencies, rudeExtname, dynamicPrerequisites } from './rude'
import { Target, TargetDeclaration } from './target'
import { cwd } from 'process'
import { Recipe, RecipeDeclaration } from './recipe'
import { Reporter } from '../reporters/reporter'
import { DotReporter } from '../reporters/dot-reporter'

const defaultRecipe = () => void (0)
const logger = Logger.getOrCreate()

/**
 * 给最终使用者的 makefile.js 中暴露的全局变量 makit 即为 Makefile 实例
 */
export class Makefile {
    public root: string
    public disableCheckCircular = false

    private ruleMap: Map<TargetDeclaration, Rule> = new Map()
    private fileTargetRules: Map<string, Rule> = new Map()
    private matchingRules: Rule[] = []
    private reporter: Reporter

    constructor (root = cwd(), reporter: Reporter = new DotReporter()) {
        this.root = root
        this.reporter = reporter
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
        const rule = this.addRule(targetDecl, [prerequisitesDecl, '$0' + rudeExtname], recipeDecl)
        rule.hasDynamicDependencies = true

        this.addRule(getDependencyFromTarget(targetDecl), dynamicPrerequisites, clearDynamicDependencies)
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
            reporter: this.reporter,
            matchRule: target => this.matchRule(target),
            disableCheckCircular: this.disableCheckCircular
        })
        try {
            await make.make(target)
        } catch (err) {
            // logger.suspend()
            if (err.target) {
                const chain = make.dependencyGraph.findPathToRoot(err.target)
                const target = chain.shift()
                err.message = `${err.message} while making "${target}"`
                for (const dep of chain) err.message += `\n    required by "${dep}"`
            }
            throw err
        }
        return make
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
