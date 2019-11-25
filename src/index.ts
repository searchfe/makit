import { Makefile } from './makefile'
import { RecipeDeclaration } from './recipe'
import { PrerequisitesDeclaration } from './prerequisites'

const makefile = global['makit'] = new Makefile()

export function setVerbose (val: boolean = true) {
    makefile.verbose = val
}

export function setRoot (val: string) {
    makefile.root = val
}

export function rule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration<void>) {
    return makefile.addRule(target, prerequisites, recipe)
}

export function invalidate (path: string) {
    return makefile.invalidate(path)
}

export function make (target: string) {
    return makefile.make(target)
}

export { Makefile } from './makefile'
