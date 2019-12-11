import { humanReadable } from '../../../src/utils/number'

describe('number', function () {
    describe('humanReadable()', function () {
        it('should format 1000 to 1,000', function () {
            expect(humanReadable(1000)).toEqual('1,000')
        })

        it('should format 1001000 to 1,001,000', function () {
            expect(humanReadable(1001000)).toEqual('1,001,000')
        })

        it('should format 12345.67 to 12,345.67', function () {
            expect(humanReadable(12345.67)).toEqual('12,345.67')
        })

        it('should format -1234 to -1,245', function () {
            expect(humanReadable(-1234)).toEqual('-1,234')
        })
    })
})
