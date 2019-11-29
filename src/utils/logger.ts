import chalk from 'chalk'

export enum LogLevel {
    error = 0,
    warning = 1,
    info = 2,
    verbose = 3,
    debug = 4,
    default = 1
}

export class Logger {
    private constructor (private loglevel: LogLevel = LogLevel.default) { }

    private static logger: Logger = null

    public static getOrCreate () {
        if (!Logger.logger) {
            Logger.logger = new Logger()
        }
        return Logger.logger
    }

    public setLevel (level: LogLevel) {
        if (level < LogLevel.error || level > LogLevel.debug) throw new Error('invalid loglevel')
        this.loglevel = level
    }

    public error (title: string, ...args: any[]) {
        if (this.loglevel < LogLevel.error) return
        console.log(chalk['red'](title), this.stringify(args))
    }

    public warning (title: string, ...args: any[]) {
        if (this.loglevel < LogLevel.warning) return
        console.log(chalk['yellow'](title), this.stringify(args))
    }

    public info (title: string, ...args: any[]) {
        if (this.loglevel < LogLevel.info) return
        console.log(chalk['cyan'](title), this.stringify(args))
    }

    public verbose (title: string, ...args: any[]) {
        if (this.loglevel < LogLevel.verbose) return
        console.log(chalk['grey'](title), this.stringify(args))
    }

    public debug (title: string, ...args: any[]) {
        if (this.loglevel < LogLevel.debug) return
        console.log(chalk['bgRed'](title), ...args)
    }

    private stringify (args) {
        return args.map(x => (x && x.toString && x.toString()) || x).join(' ')
    }
}
