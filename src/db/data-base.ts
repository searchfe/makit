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
    private data: DocumentCollection = {}
    private dirty = false

    constructor (filepath: string, private readonly fs: FileSystem) {
        this.filepath = filepath
        this.readFromDisk()
    }

    /**
     * 查询文档属性
     *
     * @param doc 文档名
     * @param prop 属性名
     * @param defaultValue 如果没有，则返回的默认值
     */
    query<T> (doc: string, prop: string, defaultValue?: T) {
        if (!this.data[doc]) {
            return defaultValue
        }
        const value = this.data[doc][prop]
        return value !== undefined ? value : defaultValue
    }

    /**
     * 写入文档属性
     *
     * @param doc 文档名
     * @param prop 属性名
     * @param newValue 新的属性值
     */
    write<T> (doc: string, prop: string, newValue: T) {
        l.debug('DTBS', () => `setting ${doc}.${prop} to ${inspect(newValue)}`)
        this.dirty = true
        this.data[doc] = this.data[doc] || {}
        this.data[doc][prop] = newValue
        return this.data[doc][prop]
    }

    /**
     * 清空文档的所有属性，或清空数据库
     *
     * @param doc 文档名，如果不传则清空所有文档
     */
    clear (doc?: string) {
        this.dirty = true
        if (doc) this.data[doc] = {}
        else this.data = {}
    }

    /**
     * 同步数据库到磁盘
     *
     * @throws 文件写入错误
     */
    syncToDisk () {
        if (!this.dirty) {
            l.debug('DTBS', `documents clean, skip syncing`)
            return false
        }
        l.verbose('DTBS', () => `syncing to disk ${this.filepath}`)
        const data = Buffer.from(JSON.stringify(this.data), 'utf8')

        try {
            // Note: should be synchronous to handle exit event,
            // after which microtasks will not be scheduled or called.
            this.fs.writeFileSync(this.filepath, data)
        } catch (err) {
            err.message = 'Error sync to disk: ' + err.message
            throw err
        }

        l.verbose('DTBS', () => `${humanReadable(data.length)} bytes written to ${this.filepath}`)
        this.dirty = false
        return true
    }

    private readFromDisk () {
        let str: string, data: any

        try {
            str = this.fs.readFileSync(this.filepath, 'utf8')
        } catch (err) {
            if (err.code === 'ENOENT') {
                // ignore if not exists, will be created on first sync
                str = '{}'
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
