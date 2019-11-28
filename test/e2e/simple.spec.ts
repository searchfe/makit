import { Makefile } from '../../src/index'
import { createMemoryFileSystem } from '../stub/memfs'
import { FileSystem } from '../../src/utils/fs'

describe('simple', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = createMemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), false, fs)
    })

    it('should build simple transform', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('simple.out', 'a.js', function () {
            fs.writeFileSync(this.targetFullPath(), this.dependencyPath())
        })
        await mk.make('simple.out')

        expect(fs.readFileSync('simple.out', 'utf8')).toEqual('a.js')
    })

    it('should build the first task by default', async function () {
        fs.writeFileSync('a.js', 'a')

        mk.addRule('simple.out', 'a.js', ctx => {
            fs.writeFileSync(ctx.targetFullPath(), ctx.dependencyPath())
        })
        await mk.make()

        expect(fs.readFileSync('simple.out', 'utf8')).toEqual('a.js')
    })
})
