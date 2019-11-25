import { Recipe } from '../../src/recipe'

describe('Recipe', function () {
    it('should make a single return statement', async function () {
        const recipe = new Recipe(() => 0)
        expect(await recipe.make({} as any)).toEqual(0)
    })
    it('should make a promise', async function () {
        const recipe = new Recipe(() => Promise.resolve('foo'))
        expect(await recipe.make({} as any)).toEqual('foo')
    })
    it('should reject by promise', function () {
        expect.assertions(1)
        const recipe = new Recipe(() => Promise.reject(new Error('foo')))
        return recipe.make({} as any).catch(e => expect(e.message).toEqual('foo'))
    })
    it('should make a callback', async function () {
        const recipe = new Recipe((ctx, done) => done(null, 'foo'))
        expect(await recipe.make({} as any)).toEqual('foo')
    })
    it('should reject by callback', function () {
        expect.assertions(1)
        const recipe = new Recipe((ctx, done) => done(new Error('foo')))
        return recipe.make({} as any).catch(e => expect(e.message).toEqual('foo'))
    })
})
