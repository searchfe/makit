#!/usr/bin/env node

import chalk from 'chalk'
import * as yargs from 'yargs'
import { existsSync } from 'fs'
import { Logger, LogLevel } from '../utils/logger'
import { resolve } from 'path'

type OptionValue = string | undefined

yargs.usage('$0 <TARGET>...')
    .option('config', {
        alias: 'c',
        type: 'string',
        default: 'makefile.js',
        description: 'makefile path'
    })
    .option('loglevel', {
        alias: 'l',
        choices: [0, 1, 2, 3, 4],
        default: 1,
        description: 'error, warning, info, verbose, debug'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        description: 'whether or not output entries'
    })
    .option('graph', {
        alias: 'g',
        type: 'boolean',
        default: false,
        description: 'output dependency graph'
    })

const targets = yargs.argv._
const makefile = resolve(yargs.argv.config as string)
const verbose = yargs.argv.verbose as boolean
const graph = yargs.argv.graph as boolean

if (verbose) Logger.getOrCreate().setLevel(LogLevel.verbose)

if (!existsSync(makefile)) {
    throw new Error('makefile.js not found')
}
console.log(chalk['cyan']('conf'), makefile)
require(makefile)
const makit = global['makit']

async function main () {
    if (targets.length) {
        await Promise.all(targets.map(target => makit.make(target)))
    } else {
        await makit.make()
    }
    if (graph) {
        makit.printGraph()
    }
}

main().catch(err => console.error(err))
