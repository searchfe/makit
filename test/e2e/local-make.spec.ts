import { Makefile } from '../../src/index'
import { createMemoryFileSystem } from '../stub/memfs'
import { FileSystem } from '../../src/utils/fs'

describe('local make', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = createMemoryFileSystem()
        mk = new Makefile(process.cwd(), false, fs)
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

        mk.addRule('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        fs.writeFileSync('bar', 'x')
        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })

    it('should not remake if dynamic dependency not updated', async function () {
        const recipeFoo = jest.fn(async ctx => {
            ctx.writeTarget('_')
            await ctx.make('bar')
        })
        const recipeBar = jest.fn(ctx => ctx.writeTarget('_'))

        mk.addRule('foo', [], recipeFoo)
        mk.addRule('bar', [], recipeBar)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(1)

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })
})
