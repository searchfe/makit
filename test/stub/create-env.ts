import { Makefile } from '../../src/index'
import { IO } from '../../src/io'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { FileSystem } from '../../src/types/fs'

export function createEnv ({
    fs = new MemoryFileSystem(),
    logLevel = Number(process.env.LOG_LEVEL || LogLevel.error)
}: {
    fs?: FileSystem,
    logLevel?: LogLevel
}) {
    const { db } = IO.resetFileSystem(fs)
    const mk = new Makefile()

    fs.mkdirSync(process.cwd(), { recursive: true })
    Logger.getOrCreate().setLevel(logLevel)
    return { fs, db, mk }
}
