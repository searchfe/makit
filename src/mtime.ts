import { TimeStamp } from './mtime'
import { Document, DataBase } from './utils/db'
import { IO } from './io'
import { FileSystem } from './types/fs'
import { Logger } from './utils/logger'

// NOT_EXIST < EMPTY_DEPENDENCY < mtimeNs < Date.now()
export const NOT_EXIST: TimeStamp = -2
export const EMPTY_DEPENDENCY: TimeStamp = -1
export type TimeStamp = number

interface MTimeEntry {
    mtimeMs: TimeStamp
    time: TimeStamp
}
interface MTimeDocument extends Document<MTimeEntry> {}

interface MetaDocument extends Document<number | string> {
    now?: number
}

const l = Logger.getOrCreate()

export class MTime {
    private fs: FileSystem
    private db: DataBase
    private static instance: MTime

    constructor (fs: FileSystem) {
        this.db = IO.getDataBase()
        this.fs = fs
    }

    public now (): TimeStamp {
        const time = this.db.query('meta', 'now', 0) + 1
        this.db.write('meta', 'now', time)
        return time
    }

    public async setModifiedTime (fullpath: string, time: TimeStamp = this.now()): Promise<TimeStamp> {
        try {
            const { mtimeMs } = await this.fs.stat(fullpath)
            this.db.write('mtime', fullpath, { mtimeMs, time })
            return time
        } catch (error) {
            if (error.code === 'ENOENT') {
                l.debug(fullpath, `not exist, skip set mtime`)
                return NOT_EXIST
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
            if (error.code === 'ENOENT') return NOT_EXIST
            throw error
        }
    }

    private queryAndValidate (fullpath: string, mtimeMs: TimeStamp) {
        const entry = this.db.query('mtime', fullpath)
        if (!entry) return null
        if (entry.mtimeMs !== mtimeMs) return null
        return entry
    }
}
