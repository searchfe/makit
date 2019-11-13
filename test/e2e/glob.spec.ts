import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'
const md5 = require('md5')

describe('glob', function () {
    beforeEach(() => removeSync('test/e2e/a.md5.out'))
    const sum = 'e57bb1e7dfca29c69727f6a40b91fa44'

    it('should support glob', async function () {
        const mk = new Makefile(__dirname)

        const target = '*.md5.out'
        const prerequisites = ctx => ctx.targetPath().replace('.md5.out', '.js')
        const recipe = async function () {
            return this.writeTarget(md5(await this.readDependency()))
        }
        mk.addRule(target, prerequisites, recipe)

        await mk.make('a.md5.out')
        expect(readFileSync('test/e2e/a.md5.out', 'utf8')).toEqual(sum)
    })

    it('should support RegExp', async function () {
        const mk = new Makefile(__dirname)

        const target = /\.md5\.out$/
        const prerequisites = ctx => ctx.targetPath().replace(ctx.match[0], '.js')
        const recipe = async function () {
            return this.writeTarget(md5(await this.readDependency()))
        }
        mk.addRule(target, prerequisites, recipe)

        await mk.make('a.md5.out')
        expect(readFileSync('test/e2e/a.md5.out', 'utf8')).toEqual(sum)
    })
})
