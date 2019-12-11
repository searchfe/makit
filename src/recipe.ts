import { Context } from './context'
import { TimeStamp } from './mtime'
import { inline, limit } from './utils/string'
const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

export type RecipeDeclaration =
    (this: Context, ctx: Context, done: (err?: Error) => any)
    => (any | Promise<any>)

export class Recipe {
    private fn: RecipeDeclaration

    constructor (fn: RecipeDeclaration) {
        this.fn = fn
    }

    public async make (context: Context): Promise<TimeStamp> {
        if (this.fn.length >= 2) {
            return new Promise((resolve, reject) => {
                this.fn.call(context, context, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })
            })
        }
        await this.fn.call(context, context)
    }

    [inspectSymbol] () {
        return limit(inline(this.fn.toString()))
    }
}
