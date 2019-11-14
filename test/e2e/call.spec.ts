import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'

describe('call', function () {
    beforeEach(() => removeSync('test/e2e/call.c.out'))

    it('should support call another make inside recipe', async function () {
        removeSync('test/e2e/call.b.out')
        removeSync('test/e2e/call.c.out')

        const mk = new Makefile(__dirname)

        mk.addRule('call.b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule('call.c.out', 'a.js', async ctx => {
            await mk.make('call.b.out')
            await ctx.writeTarget(await ctx.read('call.b.out'))
        })

        await mk.make('call.c.out')

        expect(readFileSync('test/e2e/call.c.out', 'utf8')).toEqual('B')
    })

    it('should support call another make inside prerequisites', async function () {
        removeSync('test/e2e/call.b.out')
        removeSync('test/e2e/call.c.out')

        const mk = new Makefile(__dirname)

        mk.addRule('call.b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule(
            'call.c.out',
            async () => { await mk.make('call.b.out'); return [] },
            async ctx => {
                await ctx.writeTarget(await ctx.read('call.b.out'))
            }
        )

        await mk.make('call.c.out')

        expect(readFileSync('test/e2e/call.c.out', 'utf8')).toEqual('B')
    })
})
