import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'

describe('circular', function () {
    beforeEach(function () {
        Logger.getOrCreate().setLevel(LogLevel.error)
    })
    it('should detect circular', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('circular1.out', 'circular2.out')
        mk.addRule('circular2.out', 'circular1.out')

        expect.assertions(1)
        await mk.make('circular1.out').catch(e => {
            expect(e.message).toEqual('Circular detected: circular1.out <- circular2.out <- circular1.out while making "circular2.out"\n    required by "circular1.out"')
        })
    })
})
