import { TimeStamp } from './time-stamp'
import { DataBase } from '../db'
import { FileSystem } from './file-system'
import { Logger, hlTarget } from '../utils/logger'

/**
 * 获取单例日志对象
 */
const l = Logger.getOrCreate()

/**
 * 表示文件不存在，时间戳设为最旧。让它和它的依赖处于 stale 状态。
 */
export const MTIME_NOT_EXIST: TimeStamp = -2

/*
 * 表示依赖为空时，依赖的 mtime。要比所有存在的文件都旧，
 * 但比不存在的文件要新（因为无依赖的不存在文件也需要生成）。
 * 因此：
 *
 * MTIME_NOT_EXIST < MTIME_EMPTY_DEPENDENCY < mtimeNs < #now()
 */
export const MTIME_EMPTY_DEPENDENCY: TimeStamp = -1

/**
 * 文件 mtime 的抽象
 *
 * 由于文件系统时间和 Node.js 的 Date API 不一致，
 * 会影响判断一个 target 是否 stale。
 * GNU Make 的 recipe 是独立进程而 makit 中是本地过程调用因此问题严重。
 * 一些实现细节：
 *
 * * mtime 使用正整数实现，特殊值取负数和 Infinity。
 * * 按 makit 第一次获知文件的顺序初始化 mtime。
 * * 同时提供 mtime 和严格递增的 now()，确保 now 和 mtime 一致。
 */
export class MTime {
    private static instance: MTime

    constructor (private readonly db: DataBase, private readonly fs: FileSystem) {}

    /**
     * 获取严格递增的当前时间戳
     *
     * @return 严格递增的当前时间戳
     */
    now (): TimeStamp {
        const time = +this.db.query('meta', 'now', 0) + 1
        this.db.write('meta', 'now', time)
        return time
    }

    /**
     * 设置文件修改时间，不传则设置为现在
     *
     * @param fullpath  文件全路径
     * @param time  时间戳
     */
    async setModifiedTime (fullpath: string, time: TimeStamp = this.now()): Promise<TimeStamp> {
        const mtimeMs = await this.getModifiedTimeFromFileSystem(fullpath)
        if (mtimeMs === MTIME_NOT_EXIST) return mtimeMs

        this.db.write('mtime', fullpath, { mtimeMs, time })
        l.debug('TIME', hlTarget(fullpath), `time set to`, time)
        return time
    }

    /**
     * 获取文件修改时间
     *
     * @param fullpath 文件全路径
     * @return 时间戳的 Promise
     */
    async getModifiedTime (fullpath: string): Promise<TimeStamp> {
        const mtimeMs = await this.getModifiedTimeFromFileSystem(fullpath)
        if (mtimeMs === MTIME_NOT_EXIST) return mtimeMs

        let entry = this.queryAndValidate(fullpath, mtimeMs)
        if (!entry) {
            entry = { mtimeMs, time: this.now() }
            this.db.write('mtime', fullpath, entry)
        }
        return entry.time
    }

    private async getModifiedTimeFromFileSystem (fullpath: string): Promise<TimeStamp> {
        try {
            const { mtimeMs } = await this.fs.stat(fullpath)
            return mtimeMs
        } catch (error) {
            if (error.code === 'ENOENT') {
                return MTIME_NOT_EXIST
            }
            throw error
        }
    }

    /**
     * 简单的校验，就可以不依赖数据库的并发一致性。
     */
    private queryAndValidate (fullpath: string, mtimeMs: TimeStamp) {
        const entry = this.db.query('mtime', fullpath)
        if (!entry || entry.mtimeMs !== mtimeMs) return null
        return entry
    }
}
