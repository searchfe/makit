import { Makefile } from '../../src/index'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { Logger, LogLevel } from '../../src/utils/logger'

describe('global make', function () {
    let fs
    let mk: Makefile
    beforeEach(() => {
        fs = new MemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should support call another make inside recipe', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('call.b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule('call.c.out', 'a.js', async ctx => {
            await mk.make('call.b.out')
            await ctx.writeTarget(await ctx.readFile('call.b.out'))
        })

        await mk.make('call.c.out')
        expect(fs.readFileSync('call.c.out', 'utf8')).toEqual('B')
    })

    it('should support call another make inside prerequisites', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('call.b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule(
            'call.c.out',
            async () => { await mk.make('call.b.out'); return [] },
            async ctx => {
                await ctx.writeTarget(await ctx.readFile('call.b.out'))
            }
        )

        await mk.make('call.c.out')
        expect(fs.readFileSync('call.c.out', 'utf8')).toEqual('B')
    })
})
