import { parse } from '../../src/config'

describe('config', () => {
    it('should merge CLI argv and package.json', () => {
        const conf = parse({ loglevel: 2, reporter: 'dot' }, { makit: { makefile: __filename } })
        expect(conf).toHaveProperty('loglevel', 2)
        expect(conf).toHaveProperty('makefile', __filename)
    })
})
