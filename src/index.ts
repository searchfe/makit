import { Makefile } from './makefile'
import { RecipeDeclaration } from './recipe'
import { PrerequisitesDeclaration } from './prerequisites'

const makefile = global['makit'] = new Makefile()

export function setVerbose (val: boolean = true) {
    makefile.setVerbose(val)
}

export function setRoot (val: string) {
    makefile.root = val
}

export function rule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return makefile.addRule(target, prerequisites, recipe)
}

export function updateRule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return makefile.updateRule(target, prerequisites, recipe)
}

export function updateOrAddRule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return makefile.updateOrAddRule(target, prerequisites, recipe)
}

export function make (target: string) {
    return makefile.make(target)
}

export function on (event: string, listener: (...args: any[]) => void) {
    return makefile.on(event, listener)
}

export { Makefile } from './makefile'

export { Context } from './context'
