import { Prerequisites } from './prerequisites'
import { Target } from './target'
import { Recipe } from './recipe'
import debugFactory from 'debug'

const inspect = Symbol.for('nodejs.util.inspect.custom') || 'inspect'
const debug = debugFactory('makit:rule')

export class Rule {
    public recipe: Recipe
    public target: Target
    public prerequisites: Prerequisites
    public hasDynamicDependencies = false

    constructor (
        target: Target,
        prerequisites: Prerequisites,
        recipe: Recipe
    ) {
        this.target = target
        this.prerequisites = prerequisites
        this.recipe = recipe
    }

    public match (targetFile: string) {
        return this.target.exec(targetFile)
    }

    [inspect] () {
        let str = '\n'
        /**
         * Symbols are not allowed to index an object,
         * we need `suppressImplicitAnyIndexErrors` to suppress errors.
         *
         * see: https://github.com/microsoft/TypeScript/issues/1863
         */
        str += this.target[inspect]() + ':'
        const deps = this.prerequisites[inspect]()
        if (deps) {
            str += ' ' + deps
        }
        if (this.hasDynamicDependencies) {
            if (deps) {
                str += ','
            }
            str += ' [...dynamic]'
        }
        str += '\n'
        str += '  ' + this.recipe[inspect]()
        return str
    }
}
