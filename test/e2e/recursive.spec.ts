import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'
import { createMemoryFileSystem } from '../stub/memfs'
import { FileSystem } from '../../src/utils/fs'

describe('recursive', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = createMemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.warning)
    })
    it('should recursively resolve prerequisites', async function () {
        mk.addRule('a.js', [], ctx => ctx.writeTarget('a.js'))
        mk.addRule('a.out', 'a.js', async ctx => ctx.writeTarget('a.out'))
        mk.addRule('b.out', 'a.out', async ctx => ctx.writeTarget(await ctx.readDependency()))

        await mk.make('b.out')
        expect(fs.readFileSync('b.out', 'utf8')).toEqual('a.out')
    })

    it('should not rebuild if required twice', async function () {
        fs.writeFileSync('a.js', 'A')

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

    it('should remake if dependency file not exists', async function () {
        const recipeA = jest.fn()
        const recipeB = jest.fn()
        mk.addRule('a', ['b'], recipeA)
        mk.addRule('b', [], recipeB)

        await mk.make('a')
        expect(recipeA).toBeCalledTimes(1)
        expect(recipeB).toBeCalledTimes(1)

        await mk.make('a')
        expect(recipeA).toBeCalledTimes(2)
        expect(recipeB).toBeCalledTimes(2)
    })

    it('should remake if recursive dependency file not exists', async function () {
        const recipeA = jest.fn()
        const recipeB = jest.fn()
        const recipeC = jest.fn()

        mk.addRule('a', ['b'], recipeA)
        mk.addRule('b', ['c'], recipeB)
        mk.addRule('c', [], recipeC)

        await mk.make('a')
        expect(recipeA).toBeCalledTimes(1)
        expect(recipeB).toBeCalledTimes(1)
        expect(recipeC).toBeCalledTimes(1)

        await mk.make('a')
        expect(recipeA).toBeCalledTimes(2)
        expect(recipeB).toBeCalledTimes(2)
        expect(recipeC).toBeCalledTimes(2)
    })

    it('should not remake if dependency file not updated', async function () {
        const recipe = jest.fn(ctx => ctx.writeTarget('_'))
        mk.addRule('foo', ['bar'], recipe)
        mk.addRule('bar', [], ctx => ctx.writeTarget('_'))

        await mk.make('foo')
        expect(recipe).toBeCalledTimes(1)

        await mk.make('foo')
        expect(recipe).toBeCalledTimes(1)
    })

    it('should remake if dependency file updated', async function () {
        const recipe = jest.fn(ctx => ctx.writeTarget('_'))
        mk.addRule('foo', ['bar'], recipe)
        mk.addRule('bar', [], ctx => ctx.writeTarget('_'))

        await mk.make('foo')
        expect(recipe).toBeCalledTimes(1)

        fs.writeFileSync('bar', 'x')
        await mk.make('foo')
        expect(recipe).toBeCalledTimes(2)
    })

    it('should not remake if recursive dependency file not updated', async function () {
        const recipeFoo = jest.fn(ctx => ctx.writeTarget('_'))
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))
        const recipeCoo = jest.fn(ctx => ctx.writeTarget('_'))
        mk.addRule('foo', ['bar'], recipeFoo)
        mk.addRule('bar', ['coo'], recipeBar)
        mk.addRule('coo', [], recipeCoo)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)
    })

    it('should remake if recursive dependency file updated', async function () {
        const recipeFoo = jest.fn(ctx => ctx.writeTarget('_'))
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))
        const recipeCoo = jest.fn(ctx => ctx.writeTarget('_'))
        mk.addRule('foo', ['bar'], recipeFoo)
        mk.addRule('bar', ['coo'], recipeBar)
        mk.addRule('coo', [], recipeCoo)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        fs.writeFileSync('coo', 'x')

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })
})
