import { Makefile, DirectedGraph } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'

describe('emitter test', function () {
    beforeEach(function () {
        Logger.getOrCreate().setLevel(LogLevel.error)
    })
    it('emit make & prepare event', async () => {
        const mk = new Makefile()
        mk.addRule('a', ['b'])
        mk.addRule('b', [], () => {})
        const rs: any[] = []
        mk.on('making', ({ target, parent }) => {
            rs.push(['making', target, parent])
        })
        const mkFn = ({ target, parent, graph }) => {
            rs.push(['maked', target, parent, (graph as DirectedGraph<string>).findPathToRoot(target)])
        }
        mk.on('maked', mkFn)
        await mk.make('a')
        expect(rs).toEqual([
            ['making', 'a', undefined],
            ['making', 'b', 'a'],
            ['maked', 'b', 'a', ['b', 'a']],
            ['maked', 'a', undefined, ['a']]
        ])
        mk.off('maked', mkFn)
        await mk.make('b')
        expect(rs.length).toEqual(5)
    })
})
