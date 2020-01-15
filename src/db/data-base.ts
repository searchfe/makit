import { FileSystem } from '../fs/file-system'
import { inspect } from 'util'
import { Logger } from '../utils/logger'
import { humanReadable } from '../utils/number'
import { DocumentCollection } from './document-collection'

const l = Logger.getOrCreate()

/**
 * 一个简易的 JSON 非关系性数据库。它的构成如下：
 *
 * * 一个 DataBase 对象由若干个 Document 构成
 * * 一个 Document 由若干个 Property 构成
 *
 * Note: sqlite 是各方面比较理想的替代品，但它有 Native Binding，
 * 能否成功安装会受网络、操作系统、Node 版本的影响，移植性不够。
 */
export class DataBase {
    private static instance: DataBase
    private filepath: string
    private fs: FileSystem
    private data: DocumentCollection = {}
    private dirty = false

    constructor (filepath: string, fs) {
        this.fs = fs
        this.filepath = filepath
        this.readFromDisk()
    }

    public query<T> (doc: string, prop: string, defaultValue?: T) {
        if (!this.data[doc]) {
            return defaultValue
        }
        const value = this.data[doc][prop]
        return value !== undefined ? value : defaultValue
    }

    public write<T> (doc: string, prop: string, newValue: T) {
        l.debug('DTBS', () => `setting ${doc}.${prop} to ${inspect(newValue)}`)
        this.dirty = true
        this.data[doc] = this.data[doc] || {}
        this.data[doc][prop] = newValue
        return this.data[doc][prop]
    }

    public clear (doc?: string) {
        this.dirty = true
        if (!doc) this.data = {}
        else this.data[doc] = {}
    }

    public syncToDisk () {
        if (!this.dirty) {
            l.debug('DTBS', `documents clean, skip syncing`)
            return false
        } else {
            l.verbose('DTBS', () => `syncing to disk ${this.filepath}`)
            const data = Buffer.from(JSON.stringify(this.data), 'utf8')

            // Note: should be synchronous to handle exit event,
            // after which microtasks will not be scheduled or called.
            this.fs.writeFileSync(this.filepath, data)

            l.verbose('DTBS', () => `${humanReadable(data.length)} bytes written to ${this.filepath}`)
            this.dirty = false
            return true
        }
    }

    private readFromDisk () {
        let str, data

        try {
            str = this.fs.readFileSync(this.filepath, 'utf8')
        } catch (err) {
            if (err.code === 'ENOENT') {
                // ignore if not exists, will be created on first sync
            } else {
                throw err
            }
        }

        try {
            data = JSON.parse(str)
        } catch (err) {
            // ignore corrupted file, it will be regenerated anyway
        }

        if (typeof data === 'object' && data !== null) this.data = data
    }
}
