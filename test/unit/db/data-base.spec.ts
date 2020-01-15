import { DataBase } from '../../../src/db/data-base'
import { Logger, LogMessage } from '../../../src/utils/logger'

describe('DataBase', () => {
    describe('#new()', () => {
        it('should read correct file via fs.readFileSync()', () => {
            const readFileSync = jest.fn()
            new DataBase('some-file', { readFileSync } as any)
            expect(readFileSync).toBeCalledWith('some-file', 'utf8')
        })

        it('should not throw for malformed file', () => {
            expect(() => new DataBase('some-file', {
                readFileSync: () => '({[<'
            } as any)).not.toThrow()
        })

        it('should not throw when file not exist', () => {
            expect(() => new DataBase('some-file', {
                readFileSync: () => {
                    const err = new Error()
                    err['code'] = 'ENOENT'
                    throw err
                }
            } as any)).not.toThrow()
        })

        it('should throw when file not readable', () => {
            const err = new Error('permission denied')
            err['code'] = 'EACCES'
            expect(() => new DataBase('some-file', {
                readFileSync: () => { throw err }
            } as any)).toThrow(err)
        })
    })

    describe('#query()', () => {
        it('should return existing value', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}'
            } as any)
            expect(db.query('doc', 'prop')).toEqual('FOO')
        })

        it('should return undefined for non-existed property', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}'
            } as any)
            expect(db.query('doc', 'prop1')).toBeUndefined()
        })

        it('should return undefined for non-existed doc', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}'
            } as any)
            expect(db.query('doc1', 'prop')).toBeUndefined()
        })

        it('should use default value if property not exist', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}'
            } as any)
            expect(db.query('doc', 'prop1', 'BAR')).toEqual('BAR')
        })

        it('should use default value if document not exist', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}'
            } as any)
            expect(db.query('doc1', 'prop', 'BAR')).toEqual('BAR')
        })
    })

    describe('#write()', () => {
        it('should create if document not exist', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{}'
            } as any)
            db.write('foo', 'prop', 'BAR')
            expect(db.query('foo', 'prop')).toEqual('BAR')
        })

        it('should create if property not exist', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {}}'
            } as any)
            db.write('foo', 'prop', 2)
            expect(db.query('foo', 'prop')).toEqual(2)
        })

        it('should overwrite existing property', () => {
            const db = new DataBase('foo', {
                readFileSync: () => '{"doc": {"prop": 1}}'
            } as any)
            db.write('foo', 'prop', 2)
            expect(db.query('foo', 'prop')).toEqual(2)
        })
    })

    describe('#clear()', () => {
        it('should clear specified document', () => {
            const db = new DataBase('foo', {
                readFileSync: () => JSON.stringify({
                    doc1: { foo: 'FOO' },
                    doc2: { bar: 'BAR' }
                })
            } as any)
            db.clear('doc1')
            expect(db.query('doc1', 'foo')).toEqual(undefined)
            expect(db.query('doc2', 'bar')).toEqual('BAR')
        })

        it('should clear all if document not specified', () => {
            const db = new DataBase('foo', {
                readFileSync: () => JSON.stringify({
                    doc1: { foo: 'FOO' },
                    doc2: { bar: 'BAR' }
                })
            })
            db.clear()
            expect(db.query('doc1', 'foo')).toEqual(undefined)
            expect(db.query('doc2', 'bar')).toEqual(undefined)
        })
    })

    describe('#syncToDisk()', () => {
        it('should write all documents via writeFileSync()', () => {
            const writeFileSync = jest.fn()
            const db = new DataBase('foo.db', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}',
                writeFileSync
            } as any)
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            expect(writeFileSync).toBeCalledWith(
                'foo.db',
                Buffer.from('{"doc":{"prop":"FOO"},"doc1":{"prop":"BAR"}}')
            )
        })

        it('should skip write if no writes yet (not dirty)', () => {
            const writeFileSync = jest.fn()
            const db = new DataBase('foo.db', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}',
                writeFileSync
            } as any)
            db.syncToDisk()
            expect(writeFileSync).not.toBeCalled()
        })

        it('should skip write if already in sync (not dirty)', () => {
            const writeFileSync = jest.fn()
            const db = new DataBase('foo.db', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}',
                writeFileSync
            } as any)
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            expect(writeFileSync).toBeCalledTimes(1)
            db.syncToDisk()
            expect(writeFileSync).toBeCalledTimes(1)
        })

        it('should write if dirty again', () => {
            const writeFileSync = jest.fn()
            const db = new DataBase('foo.db', {
                readFileSync: () => '{"doc": {"prop": "FOO"}}',
                writeFileSync
            } as any)
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            expect(writeFileSync).toBeCalledTimes(1)
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            expect(writeFileSync).toBeCalledTimes(2)
        })
    })
    describe('log', () => {
        const logger = Logger.getOrCreate()
        const db = new DataBase('foo.db', {
            readFileSync: jest.fn(),
            writeFileSync: jest.fn()
        } as any)
        let verbose: jest.MockInstance<void, [string, ...LogMessage[]]>
        let debug: jest.MockInstance<void, [string, ...LogMessage[]]>

        beforeEach(() => {
            verbose = jest.spyOn(logger, 'verbose')
            debug = jest.spyOn(logger, 'debug')
        })
        afterEach(() => {
            verbose.mockRestore()
            debug.mockRestore()
        })

        it('should debug output when setting property value', () => {
            db.write('doc1', 'prop', 'BAR')
            const args: any = debug.mock.calls[0]
            expect(args[0]).toEqual('DTBS')
            expect(args[1]()).toEqual(`setting doc1.prop to 'BAR'`)
        })

        it('should verbose output when syncToDisk() begin', () => {
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            const args: any = verbose.mock.calls[0]
            expect(args[0]).toEqual('DTBS')
            expect(args[1]()).toEqual('syncing to disk foo.db')
        })

        it('should verbose output bytes synced', () => {
            db.write('doc1', 'prop', 'BAR')
            db.syncToDisk()
            const len = '{"doc1":{"prop":"BAR"}}'.length
            const args: any = verbose.mock.calls[1]
            expect(args[0]).toEqual('DTBS')
            expect(args[1]()).toEqual(`${len} bytes written to foo.db`)
        })
    })
})
