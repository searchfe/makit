import { FileSystem } from './file-system'
import * as fs from 'fs'

export class NodeFileSystem implements FileSystem {
    stat (path: string): Promise<fs.Stats> {
        return fs.promises.stat(path)
    }
    statSync (path: string): fs.Stats {
        return fs.statSync(path)
    }

    readFile (path: string, encoding?: BufferEncoding): Promise<string>
    readFile (path: string, encoding?: string): Promise<string | Buffer> {
        return fs.promises.readFile(path, encoding)
    }

    readFileSync (path: string, encoding: BufferEncoding): string;
    readFileSync (path: string, encoding?: string): string | Buffer {
        return fs.readFileSync(path, encoding)
    }

    writeFile (path: string, data: string): Promise<void> {
        return fs.promises.writeFile(path, data)
    }
    writeFileSync (path: string, data: string): void {
        return fs.writeFileSync(path, data)
    }

    mkdir (path: string, options?: number | string | fs.MakeDirectoryOptions | null): Promise<void> {
        return fs.promises.mkdir(path, options)
    }
    mkdirSync (path: string, options?: number | string | fs.MakeDirectoryOptions | null): void {
        return fs.mkdirSync(path, options)
    }

    unlink (path: string): Promise<void> {
        return fs.promises.unlink(path)
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
        return fs.promises.utimes(path, atime, mtime)
    }
    utimesSync (path: string, atime: number, mtime: number) {
        return fs.utimesSync(path, atime, mtime)
    }
}
