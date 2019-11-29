import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'
import { createMemoryFileSystem } from '../stub/memfs'
import { FileSystem } from '../../src/utils/fs'

describe('async', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = createMemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.default)
    })

    it('should support async', async function () {
        fs.writeFileSync('a.js', 'a')
        mk.addRule('async.out', 'a.js', async function () {
            return this.writeTarget(this.dependencyPath())
        })
        await mk.make('async.out')

        expect(fs.readFileSync('async.out', 'utf8')).toEqual('a.js')
    })

    it('should make one file only once', async function () {
        const recipe = jest.fn()

        mk.addRule('a', ['b', 'c'])
        mk.addRule('b', 'd')
        mk.addRule('c', 'd')
        mk.addRule('d', [], recipe as any)

        await mk.make('a')
        expect(recipe).toBeCalledTimes(1)
    })
})
