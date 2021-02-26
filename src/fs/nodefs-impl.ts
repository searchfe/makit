import { FileSystem } from './file-system'
import { promisify } from 'util'
import * as fs from 'fs'

const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const unlink = promisify(fs.unlink)
const utimes = promisify(fs.utimes)

export class NodeFileSystem implements FileSystem {
    stat (path: string): Promise<fs.Stats> {
        return stat(path)
    }
    statSync (path: string): fs.Stats {
        return fs.statSync(path)
    }

    readFile (path: string, encoding?: string): Promise<string>
    readFile (path: string, encoding?: string): Promise<string | Buffer> {
        return readFile(path, encoding)
    }

    readFileSync (path: string, encoding: string): string;
    readFileSync (path: string, encoding?: string): string | Buffer {
        return fs.readFileSync(path, encoding)
    }

    writeFile (path: string, data: string): Promise<void> {
        return writeFile(path, data)
    }
    writeFileSync (path: string, data: string): void {
        return fs.writeFileSync(path, data)
    }

    mkdir (path: string, options?: number | string | fs.MakeDirectoryOptions | null): Promise<void> {
        return mkdir(path, options)
    }
    mkdirSync (path: string, options?: number | string | fs.MakeDirectoryOptions | null): void {
        return fs.mkdirSync(path, options)
    }

    unlink (path: string): Promise<void> {
        return unlink(path)
    }
    unlinkSync (path: string) {
        return fs.unlinkSync(path)
    }

    existsSync (path: string) {
        return fs.existsSync(path)
    }

    utimes (path: string, atime: number, mtime: number): Promise<void> {
        return utimes(path, atime, mtime)
    }
    utimesSync (path: string, atime: number, mtime: number) {
        return fs.utimesSync(path, atime, mtime)
    }
}
