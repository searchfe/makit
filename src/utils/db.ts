import { FileSystemImpl } from '../types/fs-impl'

export interface Document<T> {
    [key: string]: T
}

export interface Documents {
    [key: string]: Document<any>
}

export class DataBase {
    private static instance: DataBase
    private filepath: string
    private fs: FileSystemImpl
    private data: Documents = {}
    private dirty = false

    constructor (filepath: string, fs) {
        this.fs = fs
        this.filepath = filepath
        try {
            this.read()
        } catch (err) {
            if (err.code !== 'ENOENT') throw err
        }

        process.on('SIGINT', () => {
            this.syncToDisk()
        })
        process.on('SIGINT', () => this.syncToDisk())
    }

    public getDocument<T> (name: string): Document<T> {
        this.data[name] = this.data[name] || {}
        return this.data[name]
    }

    public query<T> (doc: string, prop: string, val?: T) {
        if (!this.data[doc]) {
            return val === undefined ? this.data[doc] : val
        }
        return this.data[doc][prop]
    }

    public write<T> (doc: string, prop: string, val: T) {
        this.dirty = true
        this.data[doc] = this.data[doc] || {}
        this.data[doc][prop] = val
        return this.data[doc][prop]
    }

    public clear (doc?: string) {
        this.dirty = true
        if (!doc) this.data = {}
        this.data[doc] = {}
    }

    public syncToDisk () {
        if (!this.dirty) return false
        this.fs.writeFileSync(this.filepath, JSON.stringify(this.data))
        this.dirty = false
        return true
    }

    private read () {
        const str = this.fs.readFileSync(this.filepath, 'utf8')
        try {
            const data = JSON.parse(str)
            if (typeof data === 'object' && data !== null) this.data = data
        } catch (err) {}
    }
}
