import { Logger, hlTarget } from '../utils/logger'
import chalk from 'chalk'
import { Task } from '../task'

const skipLabel = chalk.gray('SKIP')
const normalLabel = chalk.gray('MAKE')
const madeLabel = chalk.green('MADE')

export class VerboseReporter {
    constructor (
        private l: Logger = Logger.getOrCreate()
    ) {}

    public make (task: Task) {
        this.l.verbose(normalLabel, hlTarget(task.target))
    }

    public skip (task: Task) {
        this.l.info(skipLabel, hlTarget(task.target))
    }

    public made (task: Task) {
        this.l.info(madeLabel, hlTarget(task.target))
    }
}
