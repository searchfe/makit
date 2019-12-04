import { resolve, dirname } from 'path'
import { Logger } from './utils/logger'
import { Rule } from './rule'
import { delay, fromCallback } from './utils/promise'
import { FileSystem } from './utils/fs'
import { pick } from 'lodash'
import { TimeStamp } from './utils/date'
import { getDependencyFromTarget } from './rude'

const logger = Logger.getOrCreate()

interface ContextOptions {
    target: string
    match: RegExpExecArray
    root: string
    dependencies?: string[]
    fs: FileSystem
    rule: Rule
    make: (target: string) => Promise<TimeStamp>
}

export class Context {
    public readonly target: string
    public readonly match
    public readonly rule: Rule
    public dependencies: string[]

    private dynamicDependenciesUpdatedAt
    private readonly dynamicDependencies: string[] = []
    private readonly makeImpl: ContextOptions['make']
    private readonly fs: FileSystem
    private readonly root: string

    constructor ({ target, match, rule, root, dependencies = [], fs = require('fs'), make }: ContextOptions) {
        this.root = root
        this.match = match
        this.target = target
        this.dependencies = dependencies
        this.fs = fs
        this.dynamicDependenciesUpdatedAt = Date.now() / 1000
        this.rule = rule
        this.makeImpl = make
    }

    public getAllDependencies () {
        return [...this.dependencies, ...this.dynamicDependencies]
    }

    public async make (target: string) {
        this.dynamicDependencies.push(target)
        this.dynamicDependenciesUpdatedAt = Date.now() / 1000
        const ret = await this.makeImpl(target)
        await delay(30)
        return ret
    }

    public async writeDependency () {
        const filepath = getDependencyFromTarget(this.target)
        logger.debug(this.target, 'writing', filepath, 'with', this.dynamicDependencies, 'mtime', this.dynamicDependenciesUpdatedAt + 's')
        await this.outputFile(filepath, JSON.stringify(this.dynamicDependencies))
        await this.utimes(filepath, this.dynamicDependenciesUpdatedAt, this.dynamicDependenciesUpdatedAt)
    }

    public clone (options: Partial<ContextOptions>) {
        return new Context({
            ...pick(this, ['root', 'match', 'target', 'dependencies', 'fs', 'rule', 'make']),
            ...options
        })
    }

    async mkdir (filepath: string, options?) {
        return fromCallback(cb => this.fs.mkdir(this.toFullPath(filepath), options, cb))
    }

    mkdirSync (filepath: string, options) {
        return this.fs.mkdirSync(this.toFullPath(filepath), options)
    }

    async outputFile (filepath: string, content: string | Buffer) {
        return this.writeFile(filepath, content).catch(e => {
            if (e.code === 'ENOENT') {
                return this.mkdir(dirname(filepath), { recursive: true })
                    .then(() => this.writeFile(filepath, content))
            }
            throw e
        })
    }

    outputFileSync (filepath: string, content: string | Buffer) {
        try {
            return this.fs.writeFileSync(this.toFullPath(filepath), content)
        } catch (e) {
            if (e.code === 'ENOENT') {
                this.fs.mkdirSync(dirname(filepath), { recursive: true })
                return this.writeFileSync(filepath, content)
            }
            throw e
        }
    }

    async writeFile (filepath: string, content: string | Buffer) {
        return fromCallback(cb => this.fs.writeFile(this.toFullPath(filepath), content, cb))
    }

    writeFileSync (filepath: string, content: string | Buffer) {
        return this.fs.writeFileSync(this.toFullPath(filepath), content)
    }

    async readFile (filepath: string, encoding?: BufferEncoding): Promise<string>
    async readFile (filepath: string, encoding = 'utf8'): Promise<string | Buffer> {
        return fromCallback(cb => this.fs.readFile(this.toFullPath(filepath), encoding, cb))
    }

    readFileSync (filepath: string, encoding: BufferEncoding): string
    readFileSync (filepath: string, encoding = 'utf8'): string | Buffer {
        return this.fs.readFileSync(this.toFullPath(filepath), encoding)
    }

    unlinkSync (filepath: string) {
        return this.fs.unlinkSync(this.toFullPath(filepath))
    }

    unlink (filepath: string) {
        return fromCallback(cb => this.fs.unlink(this.toFullPath(filepath), cb))
    }

    exists (filepath: string) {
        return fromCallback(cb => this.fs.exists(filepath, cb))
    }

    existsSync (filepath: string) {
        return this.fs.existsSync(filepath)
    }

    utimes (filepath: string, atime: number, utime: number) {
        return fromCallback(cb => this.fs.utimes(filepath, atime, utime, cb))
    }

    utimesSync (filepath: string, atime: number, utime: number) {
        return this.fs.utimesSync(filepath, atime, utime)
    }

    async readDependency (i: number = 0): Promise<string> {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFile(this.dependencyFullPath(i))
    }

    readDependencySync (i: number = 0): string {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFileSync(this.dependencyFullPath(i), 'utf8')
    }

    targetFullPath () {
        return this.toFullPath(this.target)
    }

    targetPath () {
        return this.target
    }

    dependencyFullPath (i: number = 0): string {
        return this.toFullPath(this.dependencies[i])
    }

    dependencyPath (i: number = 0): string {
        return this.dependencies[i]
    }

    writeTarget (content: string) {
        return this.outputFile(this.targetFullPath(), content)
    }

    writeTargetSync (content: string) {
        return this.outputFileSync(this.targetFullPath(), content)
    }

    toFullPath (filename: string) {
        return resolve(this.root, filename)
    }
}
