import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'

describe('circular', function () {
    beforeEach(function () {
        Logger.getOrCreate().setLevel(LogLevel.error)
    })
    it('should detect circular', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('c1', 'c2')
        mk.addRule('c2', 'c3')
        mk.addRule('c3', 'c1')

        expect.assertions(1)
        await mk.make('c1').catch(e => {
            expect(e.message).toEqual('Circular detected: c1 -> c2 -> c3 -> c1 while making "c3"\n    required by "c2"\n    required by "c1"\n    required by "c3"')
        })
    })
})
