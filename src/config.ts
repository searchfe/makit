import { LogLevel } from './utils/logger'
import { resolve } from 'path'
import { existsSync } from 'fs'

type rawConfig = Partial<{
    graph: boolean
    makefile: string
    database: string
    require: string[]
    loglevel: number
    verbose: boolean
    debug: boolean
}>

export interface Config {
    loglevel: LogLevel
    database: string
    graph: boolean
    makefile: string
    require: string[]
}

export function parse (args: rawConfig, pkg: { makit?: rawConfig }): Config {
    const defaults = {
        database: './.makit.db',
        makefile: ['makefile.js', 'makefile.ts'],
        graph: false
    }
    const raw = Object.assign(defaults, pkg.makit, args)

    const loglevel = raw.debug ? LogLevel.debug : (raw.verbose ? LogLevel.verbose : (raw.loglevel || LogLevel.default))
    const database = raw.database as string
    const graph = raw.graph as boolean
    const require = raw.require as string[]
    const makefile = lookupMakefile(Array.isArray(raw.makefile) ? raw.makefile : [raw.makefile])

    return { loglevel, database, graph, require, makefile }
}

function lookupMakefile (makefiles: string[]) {
    for (const makefile of makefiles) {
        if (existsSync(makefile)) return resolve(makefile)
    }
    throw new Error('makefile not found')
}
