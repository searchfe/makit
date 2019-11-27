import { Context } from './context'

export type RecipeDeclaration<T> =
    (this: Context, ctx: Context, done: (err?: Error, result?: T) => any)
    => (T | Promise<T>)

export class Recipe<T> {
    private fn: RecipeDeclaration<T>

    constructor (fn: RecipeDeclaration<T>) {
        this.fn = fn
    }

    public async make (context: Context): Promise<T> {
        if (this.fn.length >= 2) {
            return new Promise((resolve, reject) => {
                this.fn.call(context, context, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })
            })
        }
        return this.fn.call(context, context)
    }
}
