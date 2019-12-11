import { NodeFileSystem } from './fs/nodefs'
import { FileSystem } from './types/fs'
import { MTime } from './mtime'
import { DataBase } from './utils/db'

export class IO {
    static fs: FileSystem
    static db: DataBase
    static mtime: MTime

    static getFileSystem (): FileSystem {
        if (!this.fs) this.fs = new NodeFileSystem()
        return this.fs
    }

    static getMTime (fs: FileSystem = this.getFileSystem()): MTime {
        if (!this.mtime) this.mtime = new MTime(fs)
        return this.mtime
    }

    static getDataBase (filepath: string = '.makit.db', fs: FileSystem = this.getFileSystem()) {
        if (!this.db) this.db = new DataBase(filepath, fs)
        return this.db
    }

    static clearDataBase () {
        if (this.db) this.db.clear()
    }

    static resetFileSystem (fs: FileSystem) {
        this.fs = fs
        delete this.mtime
        delete this.db
        return {
            fs: fs,
            db: this.getDataBase(),
            mtime: this.getMTime()
        }
    }
}
