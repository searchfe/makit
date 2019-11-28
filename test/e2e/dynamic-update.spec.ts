import { Makefile } from '../../src/index'
import { writeFileSync, statSync } from 'fs'
import { removeSync } from 'fs-extra'

describe('Dynamic update', function () {
    const output0 = 'test/e2e/bundle0.js.out'
    const output1 = 'test/e2e/bundle1.js.out'
    const input0 = 'test/e2e/input0.js.out'
    const input1 = 'test/e2e/input1.js.out'
    beforeEach(() => {
        removeSync(output0)
        removeSync(input0)
        removeSync(output1)
        removeSync(input1)
    })

    it('should trigger bundle0.js.out recipt once', async () => {
        writeFileSync(input0, Math.random())
        const mk = new Makefile()
        let recipeTimes = 0

        mk.addRule(output0, input0, ctx => {
            writeFileSync(ctx.targetFullPath(), statSync(ctx.dependencyFullPath()).mtimeMs)
            recipeTimes++
        })
        await mk.make(output0)
        // writeFileSync(randomFile, Math.random());
        await mk.make(output0)
        expect(recipeTimes).toEqual(1)
    })

    it('should trigger bundle1.js.out recipt twice', async () => {
        writeFileSync(input1, Math.random())
        const mk = new Makefile()
        let recipeTimes = 0

        mk.addRule(output1, input1, ctx => {
            writeFileSync(ctx.targetFullPath(), statSync(ctx.dependencyFullPath()).mtimeMs)
            recipeTimes++
        })
        await mk.make(output1)
        writeFileSync(input1, Math.random())
        await mk.make(output1)
        expect(recipeTimes).toEqual(2)
    })
})
