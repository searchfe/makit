import { FileSystem } from './file-system'
import * as fs from 'fs'
import { fromCallback } from '../utils/promise'

export class NodeFileSystem implements FileSystem {
    stat (path: string, options?: fs.BigIntOptions): Promise<fs.Stats> {
        return fromCallback(cb => options ? fs.stat(path, options, cb) : fs.stat(path, cb))
    }
    statSync (path: string): fs.Stats {
        return fs.statSync(path)
    }

    readFile (path: string, encoding?: BufferEncoding): Promise<string>
    readFile (path: string, encoding?: string): Promise<string | Buffer> {
        return fromCallback(cb => fs.readFile(path, encoding, cb))
    }

    readFileSync (path: string, encoding: BufferEncoding): string;
    readFileSync (path: string, encoding?: string): string | Buffer {
        return fs.readFileSync(path, encoding)
    }

    writeFile (path: string, data: string): Promise<void> {
        return fromCallback(cb => fs.writeFile(path, data, cb))
    }
    writeFileSync (path: string, data: string): void {
        return fs.writeFileSync(path, data)
    }

    mkdir (path: string, options?: number | string | fs.MakeDirectoryOptions | null): Promise<void> {
        return fromCallback(cb => fs.mkdir(path, options, cb))
    }
    mkdirSync (path: string, options?: number | string | fs.MakeDirectoryOptions | null): void {
        return fs.mkdirSync(path, options)
    }

    unlink (path: string): Promise<void> {
        return fromCallback(cb => fs.unlink(path, cb))
    }
    unlinkSync (path: string) {
        return fs.unlinkSync(path)
    }

    async exists (path: string): Promise<boolean> {
        try {
            await this.stat(path)
            return true
        } catch (err) {
            if (err.code === 'ENOENT') return false
            throw err
        }
    }
    existsSync (path: string) {
        return fs.existsSync(path)
    }

    utimes (path: string, atime: number, mtime: number): Promise<void> {
        return fromCallback(cb => fs.utimes(path, atime, mtime, cb))
    }
    utimesSync (path: string, atime: number, mtime: number) {
        return fs.utimesSync(path, atime, mtime)
    }
}
