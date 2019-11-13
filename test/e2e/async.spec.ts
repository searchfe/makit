import { Makefile } from '../../src/index'
import { readFileSync } from 'fs-extra'

describe('async', function () {
    it('should support async', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('name.async.out', 'a.js', async function () {
            return this.writeTarget(this.dependencyPath())
        })
        await mk.make('name.async.out')

        expect(readFileSync('test/e2e/name.async.out', 'utf8')).toEqual('a.js')
    })

    it('should make one file only once', async function () {
        const mk = new Makefile(__dirname)
        let count = 0

        mk.addRule('a.count.out', 'a.js', ctx => {
            return ctx.writeTarget('' + (count++))
        })
        await Promise.all([mk.make('a.count.out'), mk.make('a.count.out')])

        expect(readFileSync('test/e2e/a.count.out', 'utf8')).toEqual('0')
    })
})
