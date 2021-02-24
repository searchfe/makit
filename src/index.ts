import { Logger, LogLevel } from './utils/logger'
import { RecipeDeclaration } from './models/recipe'
import { IO } from './io'
import { PrerequisitesDeclaration } from './models/prerequisites'

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
    global['makit'].root = val
}

export function invalidate (target: string) {
    global['makit'].invalidate(target)
}

export function rule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return global['makit'].addRule(target, prerequisites, recipe)
}

export function rude (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return global['makit'].addRude(target, prerequisites, recipe)
}

export function updateRule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return global['makit'].updateRule(target, prerequisites, recipe)
}

export function updateOrAddRule (target: string, prerequisites: PrerequisitesDeclaration, recipe?: RecipeDeclaration) {
    return global['makit'].updateOrAddRule(target, prerequisites, recipe)
}

export function make (target: string) {
    return global['makit'].make(target)
}

export function disableCheckCircular () {
    global['makit'].disableCheckCircular = true
}

export { Makefile } from './models/makefile'

export { Context } from './context'

export { DirectedGraph } from './utils/graph'

export { RecipeDeclaration } from './models/recipe'

// Sync DB disk for normal exit
process.on('exit', () => IO.getOrCreateDataBase().syncToDisk())

process.on('SIGINT', () => {
    IO.getOrCreateDataBase().syncToDisk()
    // Continue to exit, otherwise SIGINT is ignored
    process.exit(1)
})
