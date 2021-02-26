import { Makefile } from '../../src/index'
import { IO } from '../../src/io'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs-impl'
import { FileSystem } from '../../src/fs/file-system'
import { TextReporter } from '../../src/reporters/text-reporter'

export function createEnv ({
    fs = new MemoryFileSystem(),
    logLevel
}: {
    fs?: FileSystem,
    logLevel?: LogLevel
}) {
    const { db } = IO.resetFileSystem(fs)
    const mk = new Makefile(undefined, new TextReporter())

    if (!fs.existsSync(process.cwd())) {
        fs.mkdirSync(process.cwd(), { recursive: true })
    }
    if (logLevel) Logger.getOrCreate().setLevel(logLevel)
    return { fs, db, mk }
}
