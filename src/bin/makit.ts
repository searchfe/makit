#!/usr/bin/env node

import chalk from 'chalk'
import * as yargs from 'yargs'
import { existsSync } from 'fs'
import { Logger, LogLevel } from '../utils/logger'
import { resolve } from 'path'
import { DataBase } from '../utils/db'

type OptionValue = string | undefined

yargs.usage('$0 <TARGET>...')
    .option('config', {
        alias: 'c',
        type: 'string',
        default: 'makefile.js',
        description: 'makefile path'
    })
    .option('database', {
        alias: 'd',
        default: './.makit.db',
        description: 'database file, will be used for cache invalidation'
    })
    .option('loglevel', {
        alias: 'l',
        choices: [0, 1, 2, 3, 4],
        description: 'error, warning, info, verbose, debug'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'set loglevel to verbose'
    })
    .option('graph', {
        alias: 'g',
        type: 'boolean',
        default: false,
        description: 'output dependency graph'
    })
    .conflicts('loglevel', 'verbose')

const targets = yargs.argv._
const makefile = resolve(yargs.argv.config as string)
const verbose = yargs.argv.verbose as boolean
const loglevel = yargs.argv.loglevel as number
const database = yargs.argv.database as string
const graph = yargs.argv.graph as boolean
const logger = Logger.getOrCreate()
DataBase.getOrCreate(database)

if (verbose !== undefined) Logger.getOrCreate().setLevel(LogLevel.verbose)
if (loglevel !== undefined) logger.setLevel(loglevel)

if (!existsSync(makefile)) {
    throw new Error('makefile.js not found')
}
logger.info(chalk['cyan']('conf'), makefile)
require(makefile)
const makit = global['makit']

async function main () {
    if (targets.length) {
        const makes = await Promise.all(targets.map(target => makit.make(target)))
        if (graph) {
            console.log(chalk['cyan']('graph'))
            makes.forEach(make => console.log(make.getGraph()))
        }
    } else {
        const make = await makit.make()
        if (graph) {
            console.log(chalk['cyan']('graph'))
            console.log(make.getGraph())
        }
    }
}

main().catch(err => console.error(err.stack))
