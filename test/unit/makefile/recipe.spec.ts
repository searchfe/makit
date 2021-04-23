import { Recipe } from '../../../src/makefile/recipe'

describe('Recipe', function () {
    const fakeContext: any = {
        targetFullPath: () => ''
    }
    it('should make a single return statement', function (done) {
        const spy = jest.fn()
        const recipe = new Recipe(spy)
        recipe.make(fakeContext, (err) => {
            expect(err).toBeNull()
            expect(spy).toHaveBeenCalledTimes(1)
            done()
        })
    })
    it('should make a promise', function (done) {
        const spy = jest.fn(() => Promise.resolve(undefined))
        new Recipe(spy).make(fakeContext, () => {
            expect(spy).toBeCalledTimes(1)
            done()
        })
    })
    it('should reject by promise', function (done) {
        const recipe = new Recipe(() => Promise.reject(new Error('foo')))
        return recipe.make(fakeContext, (err) => {
            expect(err.message).toEqual('foo')
            done()
        })
    })
    it('should make a callback', function (done) {
        const spy = jest.fn((ctx, done) => done(null))
        new Recipe(spy).make(fakeContext, () => {
            expect(spy).toBeCalledTimes(1)
            done()
        })
    })
    it('should reject by callback', function (done) {
        const recipe = new Recipe((ctx, done) => done(new Error('foo')))
        return recipe.make(fakeContext, (err) => {
            expect(err.message).toEqual('foo')
            done()
        })
    })
})
