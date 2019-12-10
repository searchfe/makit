import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { FileSystem } from '../../src/types/fs'

describe('rude', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = new MemoryFileSystem()
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should call corresponding recipe for ctx.make', async function () {
        mk.addRule('foo', [], async ctx => {
            ctx.writeTarget('_')
            await ctx.make('bar')
        })

        const recipeBar = jest.fn()
        mk.addRule('bar', [], recipeBar)

        await mk.make('foo')
        expect(recipeBar).toBeCalledTimes(1)
    })

    it('should remake if dynamic dependency updated', async function () {
        const recipeFoo = jest.fn(async ctx => {
            ctx.writeTarget('_')
            await ctx.make('bar')
        })
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))

        mk.addRude('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        fs.writeFileSync('bar', 'x')
        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })

    it('should not remake if dynamic dependency not updated', async function () {
        const recipeFoo = jest.fn(async ctx => {
            await ctx.make('bar')
            await ctx.writeTarget('_')
        })
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))

        mk.addRude('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)
        expect(recipeBar).toBeCalledTimes(1)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)
        expect(recipeBar).toBeCalledTimes(1)
    })

    it('should remake if dependency updated', async function () {
        const recipeFoo = jest.fn(async ctx => {
            ctx.writeTarget('_')
            await ctx.make('bar')
        })
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))

        mk.addRude('foo', ['coo'], recipeFoo)
        mk.addRule('bar', [], recipeBar)
        mk.addRule('coo', [], ctx => ctx.writeTarget('coo'))

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        fs.writeFileSync('coo', 'COO')
        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })
})
