import { TimeStamp } from './time-stamp'
import { DataBase } from '../db'
import { FileSystem } from './file-system'
import { Logger, hlTarget } from '../utils/logger'

// MTIME_NOT_EXIST < MTIME_EMPTY_DEPENDENCY < mtimeNs < Date.now()
export const MTIME_NOT_EXIST: TimeStamp = -2
export const MTIME_EMPTY_DEPENDENCY: TimeStamp = -1

const l = Logger.getOrCreate()

export class MTime {
    private fs: FileSystem
    private db: DataBase
    private static instance: MTime

    constructor (db: DataBase, fs: FileSystem) {
        this.db = db
        this.fs = fs
    }

    public now (): TimeStamp {
        const time = +this.db.query('meta', 'now', 0) + 1
        this.db.write('meta', 'now', time)
        return time
    }

    public async setModifiedTime (fullpath: string, time: TimeStamp = this.now()): Promise<TimeStamp> {
        try {
            const { mtimeMs } = await this.fs.stat(fullpath)
            this.db.write('mtime', fullpath, { mtimeMs, time })
            l.debug('TIME', hlTarget(fullpath), `time set to`, time)
            return time
        } catch (error) {
            if (error.code === 'ENOENT') {
                l.debug('TIME', hlTarget(fullpath), `not exist, skip set mtime`)
                return MTIME_NOT_EXIST
            }
            throw error
        }
    }

    public async getModifiedTime (fullpath: string): Promise<TimeStamp> {
        try {
            const { mtimeMs } = await this.fs.stat(fullpath)
            let entry = this.queryAndValidate(fullpath, mtimeMs)
            if (!entry) {
                entry = { mtimeMs, time: this.now() }
                this.db.write('mtime', fullpath, entry)
            }
            return entry.time
        } catch (error) {
            if (error.code === 'ENOENT') return MTIME_NOT_EXIST
            throw error
        }
    }

    /**
     * 简单的校验，就可以不依赖数据库的并发一致性。
     */
    private queryAndValidate (fullpath: string, mtimeMs: TimeStamp) {
        const entry = this.db.query('mtime', fullpath)
        if (!entry) return null
        if (entry.mtimeMs !== mtimeMs) return null
        return entry
    }
}
