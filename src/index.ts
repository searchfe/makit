import { Makefile } from './makefile'
import { recipeDeclaration } from './recipe'
import { prerequisitesDeclaration } from './rule'

const makefile = global['makit'] = new Makefile()

export function setRoot (val: string) {
    makefile.root = val
}

export function rule (target: string, prerequisites: prerequisitesDeclaration, recipe?: recipeDeclaration) {
    makefile.addRule(target, prerequisites, recipe)
}

export { Makefile } from './makefile'
