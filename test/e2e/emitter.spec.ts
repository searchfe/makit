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
        mk.on('making', ({ target }) => {
            rs.push(['making', target])
        })
        const mkFn = ({ target, graph }) => {
            rs.push(['maked', target, (graph as DirectedGraph<string>).findPathToRoot(target)])
        }
        mk.on('maked', mkFn)
        await mk.make('a')
        expect(rs).toEqual([
            ['making', 'b'],
            ['maked', 'b', ['b', 'a']],
            ['making', 'a'],
            ['maked', 'a', ['a']]
        ])
        mk.off('maked', mkFn)
        await mk.make('b')
        expect(rs.length).toEqual(5)
    })
})
