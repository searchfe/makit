import { Makefile } from './makefile'
import { Logger, LogLevel } from './utils/logger'
import { RecipeDeclaration } from './recipe'
import { IO } from './io'
import { PrerequisitesDeclaration } from './prerequisites'

const makefile = global['makit'] = new Makefile()

export function setVerbose (val: boolean = true) {
    Logger.getOrCreate().setLevel(val ? LogLevel.verbose : LogLevel.default)
}

export function setDebug (val: boolean = true) {
    Logger.getOrCreate().setLevel(val ? LogLevel.debug : LogLevel.default)
}

export function setLoglevel (val: LogLevel) {
    Logger.getOrCreate().setLevel(val)
}

export function setRoot (val: string) {
    makefile.root = val
}

export { series } from './schedule/sequential-schedule'

export function rule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return makefile.addRule(target, prerequisites, recipe)
}

export function rude (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return makefile.addRude(target, prerequisites, recipe)
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

export function off (event: string, listener: (...args: any[]) => void) {
    return makefile.off(event, listener)
}

export function disableCheckCircular () {
    makefile.disableCheckCircular = true
}

export { Makefile } from './makefile'

export { Context } from './context'

export { DirectedGraph } from './graph'

export { RecipeDeclaration } from './recipe'

process.on('beforeExit', () => IO.getDataBase().syncToDisk())
process.on('SIGINT', () => {
    IO.getDataBase().syncToDisk()
    process.exit(1)
})
