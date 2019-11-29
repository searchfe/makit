import { Context } from './context'
import { TargetHandler, Prerequisites } from './prerequisites'
import { Target } from './target'
import { Recipe } from './recipe'
import debugFactory from 'debug'

const debug = debugFactory('makit:rule')

export class Rule {
    public recipe: Recipe
    public target: Target
    public prerequisites: Prerequisites
    public hasDynamicDependencies = false
    public isDependencyTarget = false

    constructor (
        target: Target,
        prerequisites: Prerequisites,
        recipe: Recipe
    ) {
        this.target = target
        this.prerequisites = prerequisites
        this.recipe = recipe
    }

    public async map<T> (ctx: Context, maker: TargetHandler<T>) {
        return this.prerequisites.map(ctx, (target: string) => {
            ctx.dependencies.push(target)
            return maker(target)
        })
    }

    public match (targetFile: string) {
        return this.target.exec(targetFile)
    }

    public toString () {
        return '\n' + this.target.toString() + ': ' + this.prerequisites.toString() + '\n  ' + this.recipe.toString()
    }
}
