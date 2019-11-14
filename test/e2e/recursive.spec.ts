import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'

describe('recursive', function () {
    it('should recursively resolve prerequisites', async function () {
        removeSync('test/e2e/recursive.a.out')
        removeSync('test/e2e/recursive.b.out')

        const mk = new Makefile(__dirname)

        mk.addRule('recursive.a.out', 'a.js', async ctx => ctx.writeTarget('A'))
        mk.addRule('recursive.b.out', 'recursive.a.out', async ctx => ctx.writeTarget(await ctx.readDependency()))

        await mk.make('recursive.b.out')

        expect(readFileSync('test/e2e/recursive.b.out', 'utf8')).toEqual('A')
    })

    it('should not rebuild if required twice', async function () {
        removeSync('test/e2e/recursive.a.out')
        removeSync('test/e2e/recursive.b.out')
        removeSync('test/e2e/recursive.c.out')
        removeSync('test/e2e/recursive.d.out')

        const mk = new Makefile(__dirname)
        const a = jest.fn()
        const a2b = jest.fn()
        const a2c = jest.fn()
        const bc2d = jest.fn()

        mk.addRule('recursive.a.out', 'a.js', a)
        mk.addRule('recursive.b.out', 'recursive.a.out', a2b)
        mk.addRule('recursive.c.out', 'recursive.a.out', a2c)
        mk.addRule('recursive.d.out', ['recursive.b.out', 'recursive.c.out'], bc2d)

        await mk.make('recursive.d.out')

        expect(a).toHaveBeenCalledTimes(1)
        expect(a2b).toHaveBeenCalledTimes(1)
        expect(a2c).toHaveBeenCalledTimes(1)
        expect(bc2d).toHaveBeenCalledTimes(1)
    })
})
