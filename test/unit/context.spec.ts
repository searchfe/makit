import { Context } from '../../src/context'

describe('Context', function () {
    it('should resolve dependencyFullPath from root', function () {
        const ctx = new Context({ root: '/foo', dependencies: ['a'], target: 'b', match: [] })
        expect(ctx.targetFullPath()).toEqual('/foo/b')
    })
})
