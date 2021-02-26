import { resolve, dirname } from 'path'
import { MakeDirectoryOptions } from 'fs'
import { Logger, hlTarget } from './utils/logger'
import { FileSystem } from './fs/file-system'
import { TimeStamp } from './fs/time-stamp'

interface ContextOptions {
    target: string;
    match: RegExpExecArray | null;
    root: string;
    fs: FileSystem;
    make: (target: string) => Promise<TimeStamp>;
}

export class Context implements FileSystem {
    public readonly target: string
    public readonly match: RegExpExecArray | null
    public dependencies: string[] = []
    public dynamicDependencies: string[] = []
    public logger = Logger.getOrCreate()

    private readonly makeImpl: ContextOptions['make']
    private readonly fs: FileSystem
    private readonly root: string

    constructor ({ target, match, root, fs, make }: ContextOptions) {
        this.root = root
        this.match = match
        this.target = target
        this.fs = fs
        this.makeImpl = make
    }

    public async make (target: string) {
        this.logger.debug('RUDE', 'context.make called with', hlTarget(target), 'while making', hlTarget(this.target))
        this.dynamicDependencies.push(target)
        return this.makeImpl(target)
    }

    async outputFile (filepath: string, content: string | Buffer) {
        filepath = this.toFullPath(filepath)
        return this.writeFile(filepath, content).catch(async e => {
            if (e.code === 'ENOENT') {
                await this.mkdir(dirname(filepath), { recursive: true })
                return this.writeFile(filepath, content)
            }
            throw e
        })
    }

    outputFileSync (filepath: string, content: string | Buffer) {
        filepath = this.toFullPath(filepath)
        try {
            return this.fs.writeFileSync(filepath, content)
        } catch (e) {
            if (e.code === 'ENOENT') {
                this.fs.mkdirSync(dirname(filepath), { recursive: true })
                return this.writeFileSync(filepath, content)
            }
            throw e
        }
    }

    async readDependency (i = 0): Promise<string> {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFile(this.dependencyFullPath(i))
    }

    readDependencySync (i = 0): string {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFileSync(this.dependencyFullPath(i), 'utf8')
    }

    targetFullPath () {
        return this.toFullPath(this.target)
    }

    targetPath () {
        return this.target
    }

    dependencyFullPath (i = 0): string {
        return this.toFullPath(this.dependencies[i])
    }

    dependencyPath (i = 0): string {
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

    /**
     * FileSystem Implements
     */
    async mkdir (filepath: string, options?: number | string | MakeDirectoryOptions | null) {
        return this.fs.mkdir(this.toFullPath(filepath), options)
    }

    mkdirSync (filepath: string, options: number | string | MakeDirectoryOptions | null) {
        return this.fs.mkdirSync(this.toFullPath(filepath), options)
    }

    async writeFile (filepath: string, content: string | Buffer) {
        return this.fs.writeFile(this.toFullPath(filepath), content)
    }

    writeFileSync (filepath: string, content: string | Buffer) {
        return this.fs.writeFileSync(this.toFullPath(filepath), content)
    }

    async readFile (filepath: string, encoding?: string): Promise<string>
    async readFile (filepath: string, encoding = 'utf8'): Promise<string | Buffer> {
        return this.fs.readFile(this.toFullPath(filepath), encoding)
    }

    readFileSync (filepath: string, encoding: string): string
    readFileSync (filepath: string, encoding = 'utf8'): string | Buffer {
        return this.fs.readFileSync(this.toFullPath(filepath), encoding)
    }

    unlinkSync (filepath: string) {
        return this.fs.unlinkSync(this.toFullPath(filepath))
    }

    unlink (filepath: string) {
        return this.fs.unlink(this.toFullPath(filepath))
    }

    existsSync (filepath: string) {
        return this.fs.existsSync(this.toFullPath(filepath))
    }

    utimes (filepath: string, atime: number, utime: number) {
        return this.fs.utimes(this.toFullPath(filepath), atime, utime)
    }

    utimesSync (filepath: string, atime: number, utime: number) {
        return this.fs.utimesSync(this.toFullPath(filepath), atime, utime)
    }

    stat (filepath: string) {
        return this.fs.stat(this.toFullPath(filepath))
    }

    statSync (filepath: string) {
        return this.fs.statSync(this.toFullPath(filepath))
    }
}
