import { Makefile } from '../../src/index'

describe('circular', function () {
    it('should detect circular', async function () {
        const mk = new Makefile(__dirname)

        mk.addRule('circular1.out', 'circular2.out')
        mk.addRule('circular2.out', 'circular1.out')

        expect.assertions(1)
        await mk.make('circular1.out').catch(e => {
            expect(e.message).toEqual('Circular detected while making "circular1.out": circular1.out -> circular2.out -> circular1.out')
        })
    })
})
