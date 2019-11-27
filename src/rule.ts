import { Context } from './context'
import { Prerequisites } from './prerequisites'
import { Target } from './target'
import { Recipe } from './recipe'
import debugFactory from 'debug'
const debug = debugFactory('makit:rule')

export class Rule {
    public recipe: Recipe<void>
    public target: Target
    public prerequisites: Prerequisites

    constructor (
        target: Target,
        prerequisites: Prerequisites,
        recipe: Recipe<void>
    ) {
        this.target = target
        this.prerequisites = prerequisites
        this.recipe = recipe
    }

    public async dependencies (ctx: Context) {
        ctx.dependencies = await this.prerequisites.evaluate(ctx)
        return ctx.dependencies
    }

    public match (targetFile: string) {
        return this.target.exec(targetFile)
    }
}
