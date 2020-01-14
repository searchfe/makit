import { Context } from '../context'
import { TimeStamp } from '../fs/time-stamp'
import { inline, limit } from '../utils/string'
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
        // Case: make('foo')
        if (this.fn.length < 2) {
            return this.fn.call(context, context)
        }

        // Case: make('foo', cb)
        return new Promise((resolve, reject) => {
            this.fn.call(context, context, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    }

    [inspectSymbol] () {
        return limit(inline(this.fn.toString()))
    }
}
