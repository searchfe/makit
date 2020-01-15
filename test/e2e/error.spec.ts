import { Makefile } from '../../src/index'
import { FileSystem } from '../../src/fs/file-system'
import { IO } from '../../src/io'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs-impl'

describe('error', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = IO.resetFileSystem(new MemoryFileSystem()).fs
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile()
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should throw if no rule matched', async function () {
        expect.assertions(1)
        try {
            await mk.make('foo')
        } catch (err) {
            expect(err.message).toEqual('no rule matched target: "foo" while making "foo"')
        }
    })

    it('should output parents when failed', async function () {
        expect.assertions(3)

        mk.addRule('foo', ['bar'])
        mk.addRule('bar', ['coo'])

        try {
            await mk.make('foo')
        } catch (err) {
            expect(err.message).toContain('while making "coo"')
            expect(err.message).toContain('required by "bar"')
            expect(err.message).toContain('required by "foo"')
        }
    })
})
