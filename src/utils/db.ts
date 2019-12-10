import { FileSystemImpl } from '../types/fs-impl'

export interface Table<T> {
    [key: string]: T
}

export interface Tables {
    [key: string]: Table<any>
}

export class DataBase {
    private static instance: DataBase
    private filepath: string
    private fs: FileSystemImpl
    private data: Tables = {}

    static getOrCreate (filepath: string = '.makit.db', fs: FileSystemImpl = require('fs')) {
        if (!DataBase.instance) {
            this.instance = new DataBase(filepath, fs)
        }
        return this.instance
    }

    private constructor (filepath: string, fs) {
        this.fs = fs
        this.filepath = filepath
        this.read()
        process.on('SIGINT', () => this.write())
    }

    public getTable<T> (name: string): Table<T> {
        this.data[name] = this.data[name] || {}
        return this.data[name]
    }

    private read () {
        const str = this.fs.readFileSync(this.filepath, 'utf8')
        try {
            const data = JSON.parse(str)
            if (typeof data === 'object' && data !== null) this.data = data
        } catch (err) {}
    }

    private write () {
        this.fs.writeFileSync(this.filepath, JSON.stringify(this.data))
    }
}
