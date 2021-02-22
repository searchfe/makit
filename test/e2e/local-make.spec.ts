import { Makefile } from '../../src/index'
import { MemoryFileSystem } from '../../src/fs/memfs-impl'
import { IO } from '../../src/io'
import { Logger, LogLevel } from '../../src/utils/logger'

describe('local make', function () {
    let fs
    beforeEach(() => {
        fs = IO.resetFileSystem(new MemoryFileSystem()).fs
        fs.mkdirSync(process.cwd(), { recursive: true })
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should support call local make inside recipe', async function () {
        const mk = new Makefile()
        fs.writeFileSync('a.js', 'a')

        mk.addRule('b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule('c.out', 'a.js', async ctx => {
            await ctx.make('b.out')
            await ctx.writeTarget(await ctx.readFile('b.out'))
        })

        await mk.make('c.out')
        expect(fs.readFileSync('c.out', 'utf8')).toEqual('B')
    })
})
