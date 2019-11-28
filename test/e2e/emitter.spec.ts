import { Makefile } from '../../src/index'

describe('Dynamic update', function () {
    it('should trigger bundle0.js.out recipt once', async () => {
        const mk = new Makefile()
        mk.addRule('a', ['b'])
        mk.addRule('b', [], () => {})
        const rs: any[] = []
        mk.on('prepare', ({ target, parent }) => {
            rs.push(['prepare', target, parent])
        })
        mk.on('make', ({ target, parent }) => {
            rs.push(['make', target, parent])
        })
        await mk.make('a')
        expect(rs).toEqual([
            ['prepare', 'a', undefined],
            ['prepare', 'b', 'a'],
            ['make', 'b', 'a'],
            ['make', 'a', undefined]
        ])
    })
})
