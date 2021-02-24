import { Context } from './context'
import { inspect } from 'util'
import { FileSystem } from './fs/file-system'
import { TimeStamp } from './fs/time-stamp'
import { Logger, hlTarget } from './utils/logger'
import { IO } from './io'
import { isRudeDependencyFile, getDependencyFromTarget } from './models/rude'
import { Rule } from './models/rule'

const inspectKey = Symbol.for('nodejs.util.inspect.custom') || 'inspect'
const logger = Logger.getOrCreate()

interface TaskOptions {
    target: string
    match: RegExpExecArray | null
    root: string
    fs: FileSystem
    rule?: Rule,
    make: (target: string) => Promise<TimeStamp>
}

enum TaskState {
    INIT = 0,
    STARTED = 1,
    RESOLVED = 2,
    REJECTED = 3
}

// TODO rename to Target
export class Task {
    target: string
    ctx: Context
    mtime: number
    state: TaskState = TaskState.INIT
    pendingDependencyCount = 0
    error?: Error
    rule?: Rule
    promises: [(t: TimeStamp) => void, (e: Error) => void][] = []

    constructor (target: string, context: Context, mtime: number, rule?: Rule) {
        this.target = target
        this.ctx = context
        this.mtime = mtime
        this.rule = rule
    }

    public addPromise (resolve: (t: TimeStamp) => void, reject: (e: Error) => void) {
        if (this.state === TaskState.RESOLVED) resolve(this.mtime)
        else if (this.state === TaskState.REJECTED) reject(this.error!)
        else this.promises.push([resolve, reject])
    }

    public resolve () {
        this.state = TaskState.RESOLVED
        while (this.promises.length) {
            const [resolve] = this.promises.shift()!
            resolve(this.mtime)
        }
    }

    public reject (err: Error) {
        this.state = TaskState.REJECTED
        while (this.promises.length) {
            const [, reject] = this.promises.shift()!
            reject(err)
        }
        this.error = err
    }

    public start () {
        this.state = TaskState.STARTED
    }

    public reset () {
        this.state = TaskState.INIT
    }

    public isStarted () {
        return this.state >= TaskState.STARTED
    }

    public isReady () {
        return this.state === TaskState.INIT && this.pendingDependencyCount <= 0
    }

    public isFinished () {
        return this.state === TaskState.RESOLVED || this.state === TaskState.REJECTED
    }

    public updateMtime () {
        this.mtime = IO.getMTime().setModifiedTime(this.ctx.targetFullPath())
    }

    public static create ({ target, rule, match, root, fs, make }: TaskOptions) {
        const debug = target === '/Users/harttle/src/www-wise/cache/static/amd_modules/@searchfe/debug.js.inline'
        const context = new Context({ target, match, root, fs, make })
        const mtime = IO.getMTime().getModifiedTime(context.targetFullPath())

        if (rule) {
            context.dependencies.push(
                ...rule.prerequisites.getPrerequisites(context)
            )
        }

        return new Task(target, context, mtime, rule)
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
        return hlTarget(this.target) + ': ' + inspect(deps)
    }
}
