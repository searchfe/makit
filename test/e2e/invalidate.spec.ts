import { Makefile } from '../../src/index'
import { FileSystem } from '../../src/fs/file-system'
import { createEnv } from '../stub/create-env'

describe('invalidate', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        const env = createEnv({ logLevel: 1 })
        fs = env.fs
        mk = env.mk
    })

    it('should remake if dependency file newly created', async function () {
        const recipeA = jest.fn()
        const recipeB = jest.fn()

        mk.addRule('a', ['b'], recipeA)
        mk.addRule('b', [], recipeB)
        await mk.make('a')
        expect(recipeA).toBeCalledTimes(1)
        expect(recipeB).toBeCalledTimes(1)

        fs.writeFileSync('b', 'x')
        mk.invalidate('b')

        await mk.make('a')
        expect(recipeA).toBeCalledTimes(2)
        expect(recipeB).toBeCalledTimes(1)
    })

    it('should remake if dependency file updated', async function () {
        const recipe = jest.fn(ctx => ctx.writeTarget('_'))
        mk.addRule('foo', ['bar'], recipe)
        mk.addRule('bar', [], ctx => ctx.writeTarget('_'))
        await mk.make('foo')
        expect(recipe).toBeCalledTimes(1)

        fs.writeFileSync('bar', 'x')
        mk.invalidate('bar')

        await mk.make('foo')
        expect(recipe).toBeCalledTimes(2)
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
        mk.invalidate('coo')

        await mk.make('foo')
        expect(recipeFoo).toBeCalledTimes(2)
    })
})
