import { Logger } from '../utils/logger'
import { Reporter } from './reporter'
import chalk from 'chalk'

const grayDot = chalk.gray('.')
const greenDot = chalk.green('.')

export class DotReporter implements Reporter {
    constructor (
        private l: Logger = Logger.getOrCreate()
    ) {}

    public make () {
    }

    public skip () {
        this.l.infoStr(grayDot)
    }

    public made () {
        this.l.infoStr(greenDot)
    }
}
