import { Context } from './context'
import { inspect } from 'util'
import { FileSystem } from './fs/file-system'
import { TimeStamp } from './fs/time-stamp'
import { Logger, hlTarget } from './utils/logger'
import { IO } from './io'
import { isRudeDependencyFile, getDependencyFromTarget } from './makefile/rude'
import { Rule } from './makefile/rule'

const inspectKey = Symbol.for('nodejs.util.inspect.custom') || 'inspect'
const logger = Logger.getOrCreate()

interface TargetOptions {
    target: string
    match: RegExpExecArray | null
    root: string
    fs: FileSystem
    rule?: Rule,
    make: (target: string) => Promise<TimeStamp>
}

enum TargetState {
    INIT = 0,
    STARTED = 1,
    RESOLVED = 2,
    REJECTED = 3
}

export class Target {
    name: string
    ctx: Context
    mtime: number
    state: TargetState = TargetState.INIT
    pendingDependencyCount = 0
    error?: Error
    rule?: Rule
    promises: [(t: TimeStamp) => void, (e: Error) => void][] = []

    constructor (target: string, context: Context, mtime: number, rule?: Rule) {
        this.name = target
        this.ctx = context
        this.mtime = mtime
        this.rule = rule
    }

    public addPromise (resolve: (t: TimeStamp) => void, reject: (e: Error) => void) {
        if (this.state === TargetState.RESOLVED) resolve(this.mtime)
        else if (this.state === TargetState.REJECTED) reject(this.error!)
        else this.promises.push([resolve, reject])
    }

    public resolve () {
        this.state = TargetState.RESOLVED
        while (this.promises.length) {
            const [resolve] = this.promises.shift()!
            resolve(this.mtime)
        }
    }

    public reject (err: Error) {
        this.state = TargetState.REJECTED
        while (this.promises.length) {
            const [, reject] = this.promises.shift()!
            reject(err)
        }
        this.error = err
    }

    public start () {
        this.state = TargetState.STARTED
    }

    public reset () {
        this.state = TargetState.INIT
    }

    public isStarted () {
        return this.state >= TargetState.STARTED
    }

    public isReady () {
        return this.state === TargetState.INIT && this.pendingDependencyCount <= 0
    }

    public isFinished () {
        return this.state === TargetState.RESOLVED || this.state === TargetState.REJECTED
    }

    public updateMtime () {
        this.mtime = IO.getMTime().setModifiedTime(this.ctx.targetFullPath())
    }

    public static create ({ target, rule, match, root, fs, make }: TargetOptions) {
        const debug = target === '/Users/harttle/src/www-wise/cache/static/amd_modules/@searchfe/debug.js.inline'
        const context = new Context({ target, match, root, fs, make })
        const mtime = IO.getMTime().getModifiedTime(context.targetFullPath())

        if (rule) {
            context.dependencies.push(
                ...rule.prerequisites.getPrerequisites(context)
            )
        }

        return new Target(target, context, mtime, rule)
    }

    public getDependencies () {
        return this.ctx.dependencies
    }

    public async writeDependency () {
        const filepath = getDependencyFromTarget(this.ctx.target)
        logger.debug('RUDE', 'writing', filepath, 'with', this.ctx.dynamicDependencies)
        await this.ctx.outputFile(filepath, JSON.stringify(this.ctx.dynamicDependencies))
        await IO.getMTime().setModifiedTime(this.ctx.toFullPath(filepath))
    }

    [inspectKey] () {
        const deps = [
            ...this.ctx.dependencies,
            ...this.ctx.dynamicDependencies.map(dep => `${dep}(dynamic)`)
        ]
        return hlTarget(this.name) + ': ' + inspect(deps)
    }
}
