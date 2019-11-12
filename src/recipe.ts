import { Context } from './context'

export type recipeDeclaration = (this: Context, ctx: Context) => (void | Promise<void>)

export class Recipe {
    private fn: recipeDeclaration
    private root: string

    constructor (fn: recipeDeclaration, root: string) {
        this.fn = fn
        this.root = root
    }

    public async make (context: Context) {
        return new Promise((resolve, reject) => {
            const ret = this.fn.call(context, context, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
            if (ret && typeof ret.then === 'function') {
                ret.then(resolve, reject)
            }
        })
    }
}
