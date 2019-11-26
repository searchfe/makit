import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'

describe('async', function () {
    it('should support async', async function () {
        removeSync('test/e2e/async.out')

        const mk = new Makefile(__dirname)

        mk.addRule('async.out', 'a.js', async function () {
            return this.writeTarget(this.dependencyPath())
        })
        await mk.make('async.out')

        expect(readFileSync('test/e2e/async.out', 'utf8')).toEqual('a.js')
    })

    it('should make one file only once', async function () {
        const mk = new Makefile(__dirname)
        const recipe = jest.fn()

        mk.addRule('a', ['b', 'c'])
        mk.addRule('b', 'd')
        mk.addRule('c', 'd')
        mk.addRule('d', [], recipe as any)

        await mk.make('a')
        expect(recipe).toBeCalledTimes(1)
    })
})
