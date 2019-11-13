import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'

describe('call', function () {
    beforeEach(() => removeSync('test/e2e/c.out'))

    it('should support call another make inside recipe', async function () {
        removeSync('test/e2e/b.out')
        removeSync('test/e2e/c.out')

        const mk = new Makefile(__dirname)

        mk.addRule('b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule('c.out', 'a.js', async ctx => {
            await mk.make('b.out')
            await ctx.writeTarget(await ctx.read('b.out'))
        })

        await mk.make('c.out')

        expect(readFileSync('test/e2e/c.out', 'utf8')).toEqual('B')
    })

    it('should support call another make inside prerequisites', async function () {
        removeSync('test/e2e/b.out')
        removeSync('test/e2e/c.out')

        const mk = new Makefile(__dirname)

        mk.addRule('b.out', 'a.js', ctx => ctx.writeTarget('B'))
        mk.addRule(
            'c.out',
            async () => { await mk.make('b.out'); return [] },
            async ctx => {
                await ctx.writeTarget(await ctx.read('b.out'))
            }
        )

        await mk.make('c.out')

        expect(readFileSync('test/e2e/c.out', 'utf8')).toEqual('B')
    })
})
