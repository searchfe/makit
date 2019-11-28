import { Context } from './context'
import { now, TimeStamp } from './utils/date'

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
        return now()
    }
}
