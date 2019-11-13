import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'

describe('recursive', function () {
    it('should recursively resolve prerequisites', async function () {
        removeSync('test/e2e/a.out')
        removeSync('test/e2e/b.out')

        const mk = new Makefile(__dirname)

        mk.addRule('a.out', 'a.js', async ctx => ctx.writeTarget('A'))
        mk.addRule('b.out', 'a.out', async ctx => ctx.writeTarget(await ctx.readDependency()))

        await mk.make('b.out')

        expect(readFileSync('test/e2e/b.out', 'utf8')).toEqual('A')
    })

    it('should not rebuild if required twice', async function () {
        removeSync('test/e2e/a.out')
        removeSync('test/e2e/b.out')
        removeSync('test/e2e/c.out')
        removeSync('test/e2e/d.out')

        const mk = new Makefile(__dirname)
        const a = jest.fn()
        const a2b = jest.fn()
        const a2c = jest.fn()
        const bc2d = jest.fn()

        mk.addRule('a.out', 'a.js', a)
        mk.addRule('b.out', 'a.out', a2b)
        mk.addRule('c.out', 'a.out', a2c)
        mk.addRule('d.out', ['b.out', 'c.out'], bc2d)

        await mk.make('d.out')

        expect(a).toHaveBeenCalledTimes(1)
        expect(a2b).toHaveBeenCalledTimes(1)
        expect(a2c).toHaveBeenCalledTimes(1)
        expect(bc2d).toHaveBeenCalledTimes(1)
    })
})
