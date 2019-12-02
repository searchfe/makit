import { Rule } from './rule'
import { Make } from './make'
import { FileSystem } from './utils/fs'
import { Logger } from './utils/logger'
import { Prerequisites, PrerequisitesDeclaration } from './prerequisites'
import { dependencyRecipe, rudeExtname, dynamicPrerequisites } from './rude'
import { Target, TargetDeclaration } from './target'
import { cwd } from 'process'
import { Recipe, RecipeDeclaration } from './recipe'
import { EventEmitter } from 'events'

const defaultRecipe = () => void (0)
const logger = Logger.getOrCreate()

export class Makefile {
    public root: string
    public emitter: EventEmitter
    public disableCheckCircular = false

    private ruleMap: Map<TargetDeclaration, Rule> = new Map()
    private fileTargetRules: Map<string, Rule> = new Map()
    private matchingRules: Rule[] = []
    private fs: FileSystem

    constructor (root = cwd(), fs = require('fs')) {
        this.root = root
        this.fs = fs
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
        const rule = this.addRule(targetDecl, [prerequisitesDecl, dynamicPrerequisites()], recipeDecl)
        rule.hasDynamicDependencies = true
        logger.verbose('addRule', rule)

        const rude = this.addRule(targetDecl + rudeExtname, prerequisitesDecl, dependencyRecipe)
        rude.isDependencyTarget = true
        logger.verbose('addRude', rude)
    }

    public updateRule (
        targetDecl: TargetDeclaration,
        prerequisitesDecl: PrerequisitesDeclaration = [],
        recipeDecl: RecipeDeclaration = defaultRecipe
    ) {
        const rule = this.ruleMap.get(targetDecl)
        rule.prerequisites = new Prerequisites(prerequisitesDecl)
        rule.recipe = new Recipe(recipeDecl)
    }

    public async make (target?: string): Promise<Make> {
        if (!target) {
            target = this.findFirstTargetOrThrow()
        }
        const make = new Make({
            root: this.root,
            fs: this.fs,
            emitter: this.emitter,
            matchRule: target => this.matchRule(target),
            disableCheckCircular: this.disableCheckCircular
        })
        await make.make(target)
        return make
    }

    public on (event: string, fn: (...args: any[]) => void) {
        this.emitter = this.emitter || new EventEmitter()
        this.emitter.on(event, fn)
    }
    public off (event: string, fn: (...args: any[]) => void) {
        this.emitter && this.emitter.removeListener(event, fn)
    }

    private matchRule (target: string): [Rule, RegExpExecArray] {
        if (this.fileTargetRules.has(target)) {
            const match: RegExpExecArray = [target] as RegExpExecArray
            match.input = target
            match.index = 0
            return [this.fileTargetRules.get(target), match]
        }
        for (let i = this.matchingRules.length - 1; i >= 0; i--) {
            const rule = this.matchingRules[i]
            const match = rule.match(target)
            if (match) {
                return [rule, match]
            }
        }
        return [null, null]
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
