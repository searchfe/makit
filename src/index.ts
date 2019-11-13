import { Makefile } from './makefile'
import { recipeDeclaration } from './recipe'
import { PrerequisitesDeclaration } from './rule'

const makefile = global['makit'] = new Makefile()

export function setRoot (val: string) {
    makefile.root = val
}

export function rule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: recipeDeclaration) {
    return makefile.addRule(target, prerequisites, recipe)
}

export function make (target: string) {
    return makefile.make(target)
}

export { Makefile } from './makefile'
