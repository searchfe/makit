#!/usr/bin/env node

import chalk from 'chalk'
import yargs from 'yargs'
import { existsSync } from 'fs'
import { join } from 'path'
import { Make } from '../make'
import { Logger } from '../utils/logger'
import { IO } from '../io'
import { parse } from '../config'

type OptionValue = string | undefined

const argv = yargs.usage('$0 [OPTION] <TARGET>...')
    .option('makefile', {
        alias: 'm',
        type: 'string',
        description: 'makefile path, defaults to "makefile.js"'
    })
    .option('database', {
        alias: 'd',
        type: 'string',
        description: 'database file, will be used for cache invalidation, defaults to "./.makit.db"'
    })
    .option('require', {
        alias: 'r',
        type: 'array',
        string: true,
        description: 'require a module before loading makefile.js or makefile.ts'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'set loglevel to verbose'
    })
    .option('debug', {
        alias: 'v',
        type: 'boolean',
        description: 'set loglevel to debug'
    })
    .option('loglevel', {
        alias: 'l',
        choices: [0, 1, 2, 3, 4],
        description: 'error, warning, info, verbose, debug'
    })
    .option('graph', {
        alias: 'g',
        type: 'boolean',
        description: 'output dependency graph, defaults to false'
    })
    .help('help')
    .conflicts('loglevel', 'verbose')
    .argv

async function main () {
    const pkgjson = join(process.cwd(), 'package.json')
    const conf = parse(argv, existsSync(pkgjson) ? require(pkgjson) : {})
    Logger.getOrCreate(conf.loglevel)
    IO.getOrCreateDataBase(conf.database)

    Logger.getOrCreate().info(chalk['cyan']('CONF'), conf.makefile)
    for (const specifier of conf.require) require(specifier)
    require(conf.makefile)

    const makit = global['makit']
    const targets = argv._
    const tasks: Make[] = await Promise.all(targets.length ? targets.map((target: string) => makit.make(target)) : [makit.make()])
    if (conf.graph) {
        console.log(chalk['cyan']('TREE'))
        tasks.forEach(make => console.log(make.getGraph()))
    }
}

main().catch(err => console.error(err.stack))
