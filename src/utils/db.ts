import { FileSystemImpl } from '../types/fs-impl'
import { Logger } from './logger'
import { humanReadable } from './number'

const l = Logger.getOrCreate()

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
        l.debug('DTBS', () => `setting ${doc}.${prop} to`, val)
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
        if (!this.dirty) {
            l.debug('DTBS', `documents clean, skip syncing`)
            return false
        } else {
            l.verbose('DTBS', () => `syncing to disk ${this.filepath}`)
            const data = Buffer.from(JSON.stringify(this.data), 'utf8')
            this.fs.writeFileSync(this.filepath, data)
            l.verbose('DTBS', () => `${humanReadable(data.length)} bytes written to ${this.filepath}`)
            this.dirty = false
            return true
        }
    }

    private read () {
        const str = this.fs.readFileSync(this.filepath, 'utf8')
        try {
            const data = JSON.parse(str)
            if (typeof data === 'object' && data !== null) this.data = data
        } catch (err) {}
    }
}
