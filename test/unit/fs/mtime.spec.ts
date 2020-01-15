import { MTime, MTIME_NOT_EXIST } from '../../../src/fs/mtime'
import { DataBase } from '../../../src/db'
import { FileSystem } from '../../../src/fs/file-system'
import { MemoryFileSystem } from '../../../src/fs/memfs-impl'

describe('MTime', () => {
    let fs: FileSystem
    beforeEach(() => {
        fs = new MemoryFileSystem()
    })

    describe('#now()', () => {
        it('should strictly increase', () => {
            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const [t1, t2, t3] = [mtime.now(), mtime.now(), mtime.now()]
            expect(t1).toBeLessThan(t2)
            expect(t2).toBeLessThan(t3)
        })
    })

    describe('#getModifiedTime()', () => {
        it('should respect to discovery order', async () => {
            fs.writeFileSync('/foo', 'foo')
            fs.writeFileSync('/bar', 'bar')

            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const m1 = await mtime.getModifiedTime('/foo')
            const m2 = await mtime.getModifiedTime('/bar')

            expect(m1).toBeLessThan(m2)
        })

        it('should strictly increase', async () => {
            fs.writeFileSync('/foo', 'foo')
            fs.writeFileSync('/bar', 'bar')

            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const m1 = await mtime.getModifiedTime('/foo')
            const t = mtime.now()
            const m2 = await mtime.getModifiedTime('/bar')
            expect(m1).toBeLessThan(t)
            expect(t).toBeLessThan(m2)
        })

        it('should use former mtime as long as valid', async () => {
            fs.writeFileSync('/foo', 'foo')

            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const m1 = await mtime.getModifiedTime('/foo')
            const m2 = await mtime.getModifiedTime('/foo')

            expect(m1).toEqual(m2)
        })

        it('should invalidate mtime if file changed', async () => {
            fs.writeFileSync('/foo', 'foo')

            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const m1 = await mtime.getModifiedTime('/foo')
            fs.writeFileSync('/foo', 'FOO')
            const m2 = await mtime.getModifiedTime('/foo')
            expect(m2).toBeGreaterThan(m1)
        })

        it('should return MTIME_NOT_EXIST if file not found', async () => {
            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const m1 = await mtime.getModifiedTime('/foo')

            expect(m1).toEqual(MTIME_NOT_EXIST)
        })
    })

    describe('#setModifiedTime()', () => {
        it('should set modified time for existing file', async () => {
            fs.writeFileSync('/foo', 'foo')
            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const setValue = await mtime.setModifiedTime('/foo', 5)
            const getValue = await mtime.getModifiedTime('/foo')

            expect(setValue).toEqual(5)
            expect(getValue).toEqual(5)
        })

        it('should return MTIME_NOT_EXIST if file not found', async () => {
            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const setValue = await mtime.setModifiedTime('/foo', 5)
            const getValue = await mtime.getModifiedTime('/foo')

            expect(setValue).toEqual(MTIME_NOT_EXIST)
            expect(getValue).toEqual(MTIME_NOT_EXIST)
        })

        it('should set to now() if time not specified', async () => {
            fs.writeFileSync('/foo', 'foo')

            const mtime = new MTime(new DataBase('a.db', fs), fs)
            const setValue = await mtime.setModifiedTime('/foo')
            const then = mtime.now() - 1

            expect(setValue).toEqual(then)
        })
    })
})
