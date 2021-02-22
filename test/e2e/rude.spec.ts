import { Makefile } from '../../src/index'
import { FileSystem } from '../../src/fs/file-system'
import { createEnv } from '../stub/create-env'

describe('rude', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        const env = createEnv({ logLevel: 1 })
        fs = env.fs
        mk = env.mk
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

        mk = new Makefile()
        mk.addRude('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)
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

        mk = new Makefile()
        mk.addRude('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)
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

        mk = new Makefile()
        mk.addRude('foo', ['coo'], recipeFoo)
        mk.addRule('bar', [], recipeBar)
        mk.addRule('coo', [], ctx => ctx.writeTarget('coo'))
        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })
})
