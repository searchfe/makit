import { Logger, hlTarget } from '../utils/logger'
import chalk from 'chalk'
import { Target } from '../target'

const skipLabel = chalk.gray('SKIP')
const normalLabel = chalk.gray('MAKE')
const madeLabel = chalk.green('MADE')

export class VerboseReporter {
    constructor (
        private l: Logger = Logger.getOrCreate()
    ) {}

    public make (target: Target) {
        this.l.verbose(normalLabel, hlTarget(target.name))
    }

    public skip (target: Target) {
        this.l.info(skipLabel, hlTarget(target.name))
    }

    public made (target: Target) {
        this.l.info(madeLabel, hlTarget(target.name))
    }
}
