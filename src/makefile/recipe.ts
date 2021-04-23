import { Context } from '../context'
import { inline, limit } from '../utils/string'
import { ErrorFirstCallback, isThenable } from '../utils/async'
const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

export type RecipeDeclaration =
    (this: Context, ctx: Context, done?: ErrorFirstCallback<any>)
    => (any | Promise<any>)

export class Recipe {
    private fn: RecipeDeclaration

    constructor (fn: RecipeDeclaration) {
        this.fn = fn
    }

    public make (context: Context, cb: ErrorFirstCallback<void>): void {
        // recipe: (ctx, cb) => cb(null)
        if (this.fn.length >= 2) {
            this.fn.call(context, context, cb)
        } else {
            let ret = this.fn.call(context, context)
            if (isThenable(ret)) {
                // recipe: (ctx) => Promise<any>
                ret.then(() => cb(null), (err: Error) => cb(err))
            } else {
                // recipe: (ctx) => any
                cb(null)
            }
        }
    }

    [inspectSymbol] () {
        return limit(inline(this.fn.toString()))
    }
}
