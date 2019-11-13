import { Makefile } from '../../src/index'
import { removeSync, readFileSync, writeFileSync } from 'fs-extra'

describe('simple', function () {
    beforeEach(() => removeSync('test/e2e/name.out'))

    it('should build simple transform', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('name.out', 'a.js', function () {
            writeFileSync(this.targetFullPath(), this.dependencyPath())
        })
        await mk.make('name.out')

        expect(readFileSync('test/e2e/name.out', 'utf8')).toEqual('a.js')
    })

    it('should build the first task by default', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('name.out', 'a.js', ctx => {
            writeFileSync(ctx.targetFullPath(), ctx.dependencyPath())
        })
        await mk.make()

        expect(readFileSync('test/e2e/name.out', 'utf8')).toEqual('a.js')
    })
})
