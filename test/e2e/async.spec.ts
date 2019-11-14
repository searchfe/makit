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
        removeSync('test/e2e/count.out')
        const mk = new Makefile(__dirname)
        let count = 0

        mk.addRule('count.out', 'a.js', ctx => {
            return ctx.writeTarget('' + (count++))
        })
        await Promise.all([mk.make('count.out'), mk.make('count.out')])

        expect(readFileSync('test/e2e/count.out', 'utf8')).toEqual('0')
    })
})
