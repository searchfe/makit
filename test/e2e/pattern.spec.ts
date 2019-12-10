import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { FileSystem } from '../../src/types/fs'

describe('glob scopes', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = new MemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should support matching groups', async function () {
        fs.mkdirSync('src/foo', { recursive: true })
        fs.writeFileSync('src/foo/a.san.js', 'a')

        mk.addRule(
            '(src/**)/(*).md5', '$1/$2.san.js',
            async ctx => ctx.writeTarget(await ctx.readDependency())
        )

        await mk.make('src/foo/a.md5')
        expect(fs.readFileSync('src/foo/a.md5', 'utf8')).toEqual('a')
    })

    it('should match from begin to end', async function () {
        mk.addRule('build/**.js', [])
        mk.addRule('build', [], () => {
            throw new Error('should not fire build!')
        })
        await mk.make('build/a.js')

        mk.addRule('(src)/**.js', [])
        mk.addRule('s(rc)', [], () => {
            throw new Error('should not fire src!')
        })
        await mk.make('src/a.js')
    })

    it('should support groups in dependency array', async function () {
        const recipe = jest.fn()
        mk.addRule('src/(**).min.js', ['src/$1.js'], recipe)
        mk.addRule('src/a.js', [], () => void (0))
        await mk.make('src/a.min.js')
        expect(recipe).toHaveBeenCalledWith(expect.objectContaining({
            dependencies: ['src/a.js']
        }))
    })
})
