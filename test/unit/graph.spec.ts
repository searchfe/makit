import { DirectedGraph } from '../../src/graph'

describe('DirectedGraph', function () {
    describe('.hasEdge()', function () {
        it('should return true if exists', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.hasEdge('a', 'b')).toBeTruthy()
        })

        it('should return false if from not exists', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.hasEdge('b', 'c')).toBeFalsy()
        })

        it('should return false if to not exists', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.hasEdge('a', 'c')).toBeFalsy()
        })
    })

    describe('.checkCircular()', function () {
        it('should return false for empty graph', function () {
            const g = new DirectedGraph()
            expect(g.checkCircular('a')).toBeFalsy()
        })

        it('should return false if no circular', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.checkCircular('a')).toBeFalsy()
        })

        it('should return true if it\'s circular', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            g.addEdge('b', 'c')
            g.addEdge('c', 'a')
            expect(g.checkCircular('a')).toEqual(['a', 'c', 'b', 'a'])
        })

        it('should return true if there\'s self-circle', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'a')
            expect(g.checkCircular('a')).toBeTruthy()
        })
    })

    describe('.getSinglePath()', function () {
        it('should return single element for roots', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.getSinglePath('a')).toEqual(['a'])
        })
        it('should return all ascendants', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            g.addEdge('b', 'c')
            expect(g.getSinglePath('c')).toEqual(['c', 'b', 'a'])
        })
        it('should return the first path for multiple parents', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            g.addEdge('b', 'c')
            g.addEdge('d', 'c')
            expect(g.getSinglePath('c')).toEqual(['c', 'b', 'a'])
        })
        it('should print circular if there is one', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            g.addEdge('b', 'c')
            g.addEdge('c', 'a')
            expect(g.getSinglePath('a')).toEqual(['a', 'c', 'b', 'a'])
        })
    })

    describe('.toTree()', function () {
        it('should construct a tree for graph with a single edge', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.toTree()).toEqual({ b: {} })
        })
    })

    describe('.toString()', function () {
        it('should print a tree for graph with a single edge', function () {
            const g = new DirectedGraph()
            g.addEdge('a', 'b')
            expect(g.toString()).toEqual('a\n└─ b\n')
        })
    })
})
