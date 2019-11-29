import { Makefile, DirectedGraph } from '../../src/index'

describe('emitter test', function () {
    it('emit make & prepare event', async () => {
        const mk = new Makefile()
        mk.addRule('a', ['b'])
        mk.addRule('b', [], () => {})
        const rs: any[] = []
        mk.on('prepare', ({ target, parent }) => {
            rs.push(['prepare', target, parent])
        })
        const mkFn = ({ target, parent, graph }) => {
            rs.push(['make', target, parent, (graph as DirectedGraph<string>).getSinglePath(target)])
        }
        mk.on('make', mkFn)
        await mk.make('a')
        expect(rs).toEqual([
            ['prepare', 'a', undefined],
            ['prepare', 'b', 'a'],
            ['make', 'b', 'a', ['b', 'a']],
            ['make', 'a', undefined, ['a']]
        ])
        mk.off('make', mkFn)
        await mk.make('b')
        expect(rs.length).toEqual(5)
    })
})
