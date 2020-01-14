import { Makefile } from '../../src/index'
import { IO } from '../../src/io'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs-impl'
import { FileSystem } from '../../src/types/fs'

describe('simple', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = IO.resetFileSystem(new MemoryFileSystem()).fs
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile()
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should build simple transform', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('simple.out', 'a.js', function () {
            fs.writeFileSync(this.targetFullPath(), this.dependencyPath())
        })
        await mk.make('simple.out')

        expect(fs.readFileSync('simple.out', 'utf8')).toEqual('a.js')
    })

    it('should build the first task by default', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('simple.out', 'a.js', ctx => {
            fs.writeFileSync(ctx.targetFullPath(), ctx.dependencyPath())
        })
        await mk.make()

        expect(fs.readFileSync('simple.out', 'utf8')).toEqual('a.js')
    })
})
