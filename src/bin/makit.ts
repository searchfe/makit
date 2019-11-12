#!/usr/bin/env node

import chalk from 'chalk'
import * as yargs from 'yargs'
import { existsSync } from 'fs'
import { resolve } from 'path'

type OptionValue = string | undefined

yargs.usage('$0 <TARGET>...')
    .option('config', {
        alias: 'c',
        default: 'makefile.js',
        description: 'makefile path'
    })

const targets = yargs.argv._
const makefile = resolve(yargs.argv.config as string)

if (!existsSync(makefile)) {
    throw new Error('makefile.js not found')
}
console.log(chalk.gray('config'), makefile)
require(makefile)
const makit = global['makit']

async function main () {
    if (targets.length) {
        await Promise.all(targets.map(target => makit.make(target)))
        console.log(chalk.green('success'), targets.join(','))
    } else {
        const target = await makit.make()
        console.log(chalk.green('success'), target)
    }
}

main().catch(err => console.error(err))
