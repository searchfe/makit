import { Makefile } from '../../src/index'
import { removeSync, readFileSync } from 'fs-extra'
const md5 = require('md5')

describe('glob', function () {
    const output0 = 'test/e2e/d.md5.out'
    beforeEach(() => removeSync(output0))
    const sum = 'e9a2fb30a1914745db8f4a114f7484b5'

    it('should support matchMode', async function () {
        const mk = new Makefile(process.cwd())

        const recipe = async function () {
            return this.writeTarget(md5(await this.readDependency()))
        }
        mk.addRule('(test/**)/(*).md5.out', '$1/$2.san.js', recipe)

        await mk.make(output0)
        expect(readFileSync(output0, 'utf8')).toEqual(sum)
    })
})
