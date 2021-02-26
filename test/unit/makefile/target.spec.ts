import { Target } from '../../../src/makefile/target'

describe('Target', function () {
    it('should support exact match', function () {
        const t = new Target('a.ts')

        expect(t.exec('a.ts')).toInclude('a.ts')
        expect(t.exec('a.js')).toBeNull()
    })

    it('should support wildcard', function () {
        const t = new Target('*.ts')
        expect(t.exec('a.ts')).toInclude('a.ts')
        expect(t.exec('a.js')).toBeNull()
    })

    it('should support groups', function () {
        const t = new Target('(*)/(*).ts')
        expect(t.exec('foo/bar.ts')).toIncludeMultiple(['foo/bar.ts', 'foo', 'bar'])
    })

    it('should support glob negation', function () {
        const t = new Target('src/!(*.ts)')
        expect(t.exec('src/a.js')).toInclude('src/a.js')
        expect(t.exec('src/b.ts')).toBeNull()
    })

    it('should support glob negation with groups', function () {
        const t = new Target('(*)/!(*.ts)')
        expect(t.exec('src/a.js')).toIncludeMultiple(['src/a.js', 'src'])
        expect(t.exec('src/b.ts')).toBeNull()
    })
})
