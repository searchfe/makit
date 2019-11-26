
export class Logger {
    public isVerbose: boolean = false

    constructor (verbose: boolean) {
        this.isVerbose = verbose
    }

    public verbose (title, ...args) {
        if (!this.isVerbose) return
        console.log(title, ...args)
    }

    public log (title: string, ...args: string[]) {
        console.log(title, ...args)
    }
}
