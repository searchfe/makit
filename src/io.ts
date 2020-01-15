import { NodeFileSystem } from './fs/nodefs-impl'
import { FileSystem } from './fs/file-system'
import { MTime } from './fs/mtime'
import { DataBase } from './db'

export class IO {
    static fs: FileSystem
    static db: DataBase
    static mtime: MTime

    static getFileSystem (): FileSystem {
        if (!this.fs) this.fs = new NodeFileSystem()
        return this.fs
    }

    static getMTime (
        db: DataBase = IO.getDataBase(),
        fs: FileSystem = this.getFileSystem()
    ): MTime {
        if (!this.mtime) this.mtime = new MTime(db, fs)
        return this.mtime
    }

    static getDataBase (filepath: string = '.makit.db', fs: FileSystem = this.getFileSystem()) {
        if (!this.db) this.db = new DataBase(filepath, fs)
        return this.db
    }

    static clearDataBase () {
        if (this.db) this.db.clear()
    }

    static resetFileSystem (newFS: FileSystem) {
        this.fs = newFS
        delete this.mtime
        delete this.db
        return {
            fs: newFS,
            db: this.getDataBase(),
            mtime: this.getMTime()
        }
    }
}
