import { Context } from './context'
import { Recipe } from './recipe'
import { makeRe } from 'minimatch'
import debugFactory from 'debug'

const isGlob = require('is-glob')
const debug = debugFactory('makit:rule')

type prerequisitesResolver = (context: Context) => (string[] | string | Promise<string | string[]>)
type prerequisitesItem = string | prerequisitesResolver

export type TargetDeclaration = string | RegExp
export type PrerequisitesDeclaration = string | prerequisitesResolver | (string | prerequisitesResolver)[]
export enum TargetType {
    glob,
    regexp,
    filepath
}

export class Rule {
    public targetType: TargetType
    public target: TargetDeclaration
    public recipe: Recipe

    private rTarget: RegExp
    private prerequisites: PrerequisitesDeclaration

    constructor (
        target: TargetDeclaration,
        prerequisites: PrerequisitesDeclaration,
        recipe: Recipe
    ) {
        this.target = target
        this.prerequisites = prerequisites
        this.recipe = recipe
        this.rTarget = typeof target === 'string' ? makeRe(target) : target
        this.targetType = target instanceof RegExp
            ? TargetType.regexp
            : (
                isGlob(target) ? TargetType.glob : TargetType.filepath
            )
    }

    public targetIsFilePath (): this is {target: string} {
        return this.targetType === TargetType.filepath
    }

    public getPrerequisites (context: Context) {
        return getPrerequisitesFromDeclaration(context, this.prerequisites)
    }

    public match (target: string) {
        debug('matching', target, 'against', this.rTarget)
        return this.rTarget.exec(target)
    }
}

async function getPrerequisitesFromDeclaration (ctx: Context, decl: PrerequisitesDeclaration) {
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
