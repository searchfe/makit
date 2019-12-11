import chalk from 'chalk'

export enum LogLevel {
    error = 0,
    warning = 1,
    info = 2,
    verbose = 3,
    debug = 4,
    default = 2
}

export function hlTarget (str: string) {
    return chalk['cyan'](str)
}

export class Logger {
    private static instance: Logger = null
    private suspended = false

    private constructor (private loglevel: LogLevel = LogLevel.default) { }

    public static getOrCreate (...args: any[]) {
        if (!Logger.instance) {
            Logger.instance = new Logger(...args)
        }
        return Logger.instance
    }

    public resume () {
        this.suspended = false
    }

    public suspend () {
        this.suspended = true
    }

    public setLevel (level: LogLevel) {
        if (level < LogLevel.error || level > LogLevel.debug) throw new Error('invalid loglevel')
        this.loglevel = level
    }

    public error (title: string, ...args: any[]) {
        if (this.suspended || this.loglevel < LogLevel.error) return
        this.doLog(chalk.red(title), args)
    }

    public warning (title: string, ...args: any[]) {
        if (this.suspended || this.loglevel < LogLevel.warning) return
        this.doLog(chalk.yellow(title), args)
    }

    public info (title: string, ...args: any[]) {
        if (this.suspended || this.loglevel < LogLevel.info) return
        this.doLog(chalk.cyan(title), args)
    }

    public verbose (title: string, ...args: any[]) {
        if (this.suspended || this.loglevel < LogLevel.verbose) return
        this.doLog(chalk.gray(title), args)
    }

    public debug (title: string, ...args: any[]) {
        if (this.suspended || this.loglevel < LogLevel.debug) return
        this.doLog(chalk.magenta(title), args)
    }

    private doLog (title, args) {
        console.log(chalk.inverse(title), ...args.map(x => typeof x === 'function' ? x() : x))
    }
}
