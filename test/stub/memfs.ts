import { FileSystem } from '../../src/utils/fs'
import { now, TimeStamp } from '../../src/utils/date'
import { resolve } from 'path'
import { Stats, MakeDirectoryOptions } from 'fs'
import { Callback } from '../../src/utils/callback'
import MemoryFileSystem from 'memory-fs'

const cwd = process.cwd()

export function createMemoryFileSystem (): FileSystem {
    const fs = new MemoryFileSystem()
    const mtime: Map<string, TimeStamp> = new Map()

    return {
        mkdir (path: string, options: MakeDirectoryOptions = {}, cb?: Callback<void>) {
            this.mkdirSync(path, options)
            cb(null)
        },
        mkdirSync (path: string, options: MakeDirectoryOptions = {}) {
            const fullpath = resolve(cwd, path)
            if (options.recursive) return fs.mkdirpSync(fullpath)
            return fs.mkdirSync(fullpath)
        },

        readFile (path: string, encoding: string, cb?: Callback<Buffer | string>) {
            cb(null, this.readFileSync(path, encoding))
        },
        readFileSync (path: string, encoding: string) {
            const fullpath = resolve(cwd, path)
            return fs.readFileSync(fullpath, encoding)
        },

        writeFile (path: string, data: any, cb: Callback<void>) {
            this.writeFileSync(path, data)
            cb(null)
        },
        writeFileSync (path: string, data: any) {
            const fullpath = resolve(cwd, path)
            mtime.set(fullpath, now())
            return fs.writeFileSync(fullpath, data)
        },

        stat (path: string, cb: Callback<Stats>) {
            try {
                cb(null, this.statSync(path))
            } catch (err) {
                cb(err)
            }
        },

        statSync (path: string): Stats {
            const fullpath = resolve(cwd, path)
            if (!mtime.has(fullpath)) {
                const err = new Error(`file ${fullpath} not found`) as any
                err.code = 'ENOENT'
                throw err
            }
            return {
                mtime: mtime.get(fullpath),
                mtimeMs: mtime.get(fullpath),
                mtimeNs: mtime.get(fullpath)
            } as any
        }
    } as FileSystem
}
