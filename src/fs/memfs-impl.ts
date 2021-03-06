import { FileSystem } from './file-system'
import { TimeStamp } from './time-stamp'
import { resolve } from 'path'
import { MakeDirectoryOptions, Stats } from 'fs'
import MemoryFileSystemImpl from 'memory-fs'

/**
 * memory-fs 对 FileSystem 接口的封装。目前这个类只用于跑测试。
 */
export class MemoryFileSystem implements FileSystem {
    private mtimes: Map<string, TimeStamp> = new Map()
    private fs = new MemoryFileSystemImpl()
    private now = 10000

    async mkdir (path: string, options: MakeDirectoryOptions = {}) {
        this.mkdirSync(path, options)
    }
    mkdirSync (path: string, options: MakeDirectoryOptions = {}) {
        const fullpath = resolve(path)
        options.recursive ? this.fs.mkdirpSync(fullpath) : this.fs.mkdirSync(fullpath)
    }

    readFile (path: string, encoding?: string) {
        return this.readFileSync(path, encoding)
    }
    readFileSync (path: string, encoding?: string) {
        const fullpath = resolve(path)
        return this.fs.readFileSync(fullpath, encoding)
    }

    async writeFile (path: string, data: string) {
        this.writeFileSync(path, data)
    }
    writeFileSync (path: string, data: any) {
        const fullpath = resolve(path)
        this.mtimes.set(fullpath, this.now++)
        return this.fs.writeFileSync(fullpath, data)
    }

    async stat (path: string) {
        return this.statSync(path)
    }

    statSync (path: string) {
        const fullpath = resolve(path)
        if (!this.mtimes.has(fullpath)) {
            const err = new Error(`file ${fullpath} not found`) as any
            err.code = 'ENOENT'
            throw err
        }
        return {
            mtime: new Date(this.mtimes.get(fullpath)!),
            mtimeMs: this.mtimes.get(fullpath)
        } as Stats
    }

    async unlink (path: string) {
        this.unlinkSync(path)
    }
    unlinkSync (path: string) {
        const fullpath = resolve(path)
        this.fs.unlinkSync(fullpath)
    }

    async exists (path: string) {
        return this.existsSync(path)
    }
    existsSync (path: string) {
        const fullpath = resolve(path)
        return this.fs.existsSync(fullpath)
    }

    async utimes (path: string, atime: number, mtime: number) {
        this.utimesSync(path, atime, mtime)
    }
    utimesSync (path: string, atime: number, mtime: number) {
        const fullpath = resolve(path)
        this.mtimes.set(fullpath, mtime)
    }
}
