import { Makefile } from '../../src/index'
import { createEnv } from '../stub/create-env'
import { series } from '../../src/schedule/sequential-schedule'
import 'jest-extended'

describe('series', function () {
    let mk: Makefile
    beforeEach(() => {
        const env = createEnv({ logLevel: 1 })
        mk = env.mk
    })

    it('should build series one by one', async function () {
        const insideFoo = jest.fn()
        const recipeBar = jest.fn()
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }))
        mk.addRule('bar', [], recipeBar)
        mk.addRule('all', series('foo', 'bar'))

        await mk.make('all')
        expect(insideFoo).toHaveBeenCalledBefore(recipeBar)
    })

    it('should allow series inside concurrent', async function () {
        const insideFoo = jest.fn()
        const recipeBar = jest.fn()
        const recipeCoo = jest.fn()
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }))
        mk.addRule('bar', [], recipeBar)
        mk.addRule('coo', [], recipeCoo)
        mk.addRule('all', [series('foo', 'bar'), 'coo'])

        await mk.make('all')
        expect(insideFoo).toHaveBeenCalledBefore(recipeBar)
        expect(recipeCoo).toHaveBeenCalledBefore(insideFoo)
    })

    it('should be concurrent between series', async function () {
        const insideFoo = jest.fn()
        const insideBar = jest.fn()
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }))
        mk.addRule('bar', [], (ctx, done) => { insideBar(); done() })
        mk.addRule('all', [series('foo'), series('bar')])

        await mk.make('all')
        expect(insideBar).toHaveBeenCalledBefore(insideFoo)
    })

    it('should allow concurrent inside series', async function () {
        const insideBar = jest.fn()
        const recipeCoo = jest.fn()
        mk.addRule('foo', [], jest.fn())
        mk.addRule('bar', [], (ctx, done) => setTimeout(() => { insideBar(); done() }))
        mk.addRule('coo', [], recipeCoo)
        mk.addRule('all', series('foo', ['bar', 'coo']))

        await mk.make('all')
        expect(recipeCoo).toHaveBeenCalledBefore(insideBar)
    })

    it('should allow concurrent inside concurrent', async function () {
        const foo = jest.fn()
        const bar = jest.fn()
        const coo = jest.fn()
        mk.addRule('foo', [], foo)
        mk.addRule('bar', [], bar)
        mk.addRule('coo', [], coo)
        mk.addRule('all', [['foo', 'bar'], ['coo']])

        await mk.make('all')
        expect(foo).toHaveBeenCalled()
        expect(bar).toHaveBeenCalled()
        expect(coo).toHaveBeenCalled()
    })

    it('should allow series inside series', async function () {
        const bar = jest.fn()
        const coo = jest.fn()

        mk.addRule('foo')
        mk.addRule('bar', [], (ctx, done) => setTimeout(() => { bar(); done() }))
        mk.addRule('coo', [], coo)
        mk.addRule('all', series('foo', series('bar', 'coo')))

        await mk.make('all')
        expect(bar).toHaveBeenCalledBefore(coo)
    })
})
