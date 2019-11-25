import { Context } from './context'
import { Recipe } from './recipe'
import debugFactory from 'debug'
const extglob = require('extglob')

const isGlob = require('is-glob')
const debug = debugFactory('makit:rule')

type prerequisitesResolver = (context: Context) => (string[] | string | Promise<string | string[]>)
type prerequisitesItem = string | prerequisitesResolver
enum PrerequisiteMode {
    Match,
    Static,
    String,
    StringArray,
    Function,
    FunctionArray
}

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
    public recipe: Recipe<void>

    private rTarget: RegExp
    private prerequisites: PrerequisitesDeclaration
    private prerequisiteMode: PrerequisiteMode;

    constructor (
        target: TargetDeclaration,
        prerequisites: PrerequisitesDeclaration,
        recipe: Recipe<void>
    ) {
        this.target = target

        this.prerequisites = prerequisites
        if (typeof prerequisites === 'string') {
            if (prerequisites.match(/\$\d/)) {
                this.prerequisiteMode = PrerequisiteMode.Match
            } else {
                this.prerequisiteMode = PrerequisiteMode.String
            }
        } else if (Array.isArray(prerequisites)) {
            if (typeof (prerequisites[0]) === 'string') {
                this.prerequisiteMode = PrerequisiteMode.StringArray
            } else if (typeof (prerequisites[0]) === 'function') {
                this.prerequisiteMode = PrerequisiteMode.FunctionArray
            }
        } else {
            this.prerequisiteMode = PrerequisiteMode.Function
        }

        this.recipe = recipe
        if (typeof target === 'string') {
            if (target.indexOf('(') > -1) {
                // Matching Mode
                this.rTarget = new RegExp('^' + extglob(target).replace(/\(\?:/g, '(') + '$')
            } else {
                // Support Backward reference
                this.rTarget = extglob.makeRe(target)
            }
        } else {
            this.rTarget = target
        }
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
        return this.getPrerequisitesFromDeclaration(context, this.prerequisites)
    }

    public match (target: string) {
        debug('matching', target, 'against', this.rTarget)
        return this.rTarget.exec(target)
    }

    public async getPrerequisitesFromDeclaration (ctx: Context, decl: PrerequisitesDeclaration) {
        switch (this.prerequisiteMode) {
        case PrerequisiteMode.Match:
            decl = (decl as string).replace(/\$(\d+)/g, (all, index) => {
                return ctx.match[index]
            })
            decl = [decl]
            break
        case PrerequisiteMode.String:
            decl = [decl as string]
            break
        case PrerequisiteMode.Function:
            decl = [decl as prerequisitesResolver]
            break
        case PrerequisiteMode.FunctionArray:
            decl = decl as prerequisitesResolver[]
            break
        case PrerequisiteMode.StringArray:
            decl = decl as string[]
            break
        default:
            return []
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
}
