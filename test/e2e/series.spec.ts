import { Makefile } from '../../src/index'
import { createMemoryFileSystem } from '../stub/memfs'
import { FileSystem } from '../../src/utils/fs'
import { series } from '../../src/schedule/sequential-schedule'
import 'jest-extended'

describe('series', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = createMemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), false, fs)
    })

    it('should build series one by one', async function () {
        const insideFoo = jest.fn()
        const recipeBar = jest.fn()
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }, 50))
        mk.addRule('bar', [], recipeBar)
        mk.addRule('all', series('foo', 'bar'))

        await mk.make('all')
        expect(insideFoo).toHaveBeenCalledBefore(recipeBar)
    })

    it('should allow series inside concurrent', async function () {
        const insideFoo = jest.fn()
        const recipeBar = jest.fn()
        const recipeCoo = jest.fn()
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }, 50))
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
        mk.addRule('foo', [], (ctx, done) => setTimeout(() => { insideFoo(); done() }, 50))
        mk.addRule('bar', [], (ctx, done) => { insideBar(); done() })
        mk.addRule('all', [series('foo'), series('bar')])

        await mk.make('all')
        expect(insideBar).toHaveBeenCalledBefore(insideFoo)
    })
})
