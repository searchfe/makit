import { Context } from './context'
import { Recipe } from './recipe'
import { makeRe } from 'minimatch'
import debugFactory from 'debug'

const isGlob = require('is-glob')
const debug = debugFactory('makit:rule')

type prerequisitesResolver = (context: Context) => (string[] | string)
type prerequisitesItem = string | prerequisitesResolver

export type TargetDeclaration = string | RegExp
export type prerequisitesDeclaration = string | prerequisitesResolver | (string | prerequisitesResolver)[]

export class Rule {
    public isGlob: boolean
    public target: TargetDeclaration
    public recipe: Recipe

    private rTarget: RegExp
    private prerequisites: prerequisitesDeclaration

    constructor (
        target: TargetDeclaration,
        prerequisites: prerequisitesDeclaration,
        recipe: Recipe
    ) {
        this.target = target
        this.prerequisites = prerequisites
        this.recipe = recipe
        this.rTarget = typeof target === 'string' ? makeRe(target) : target
        this.isGlob = isGlob(target)
    }

    public getPrerequisites (context: Context) {
        return getPrerequisitesFromDeclaration(context, this.prerequisites)
    }

    public match (target: string) {
        debug('matching', target, 'against', this.rTarget)
        return this.rTarget.exec(target)
    }
}

async function getPrerequisitesFromDeclaration (ctx: Context, decl: prerequisitesDeclaration) {
    if (!Array.isArray(decl)) {
        decl = [decl]
    }
    const result = []
    for (const dependency of decl) {
        if (typeof dependency === 'function') {
            const deps = await dependency(ctx)
            if (Array.isArray(deps)) {
                result.push(...deps)
            } else {
                result.push(deps)
            }
        } else {
            result.push(dependency)
        }
    }
    return result
}
