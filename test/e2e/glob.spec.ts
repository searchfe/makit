import { Makefile } from '../../src/index'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { FileSystem } from '../../src/types/fs'
import { Logger, LogLevel } from '../../src/utils/logger'

const md5 = require('md5')

describe('glob', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = new MemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should support glob', async function () {
        const target = '*.md5.out'
        const prerequisites = () => 'a.js'
        const recipe = async function () {
            return this.writeTarget(md5(await this.readDependency()))
        }
        fs.writeFileSync('a.js', 'console.log(1)')
        mk.addRule(target, prerequisites, recipe)

        await mk.make('glob.md5.out')
        expect(fs.readFileSync('glob.md5.out', 'utf8')).toEqual('6114f5adc373accd7b2051bd87078f62')
    })

    it('should support RegExp', async function () {
        const target = /\.md5\.out$/
        const prerequisites = () => 'a.js'
        const recipe = async function () {
            return this.writeTarget(md5(await this.readDependency()))
        }
        fs.writeFileSync('a.js', 'console.log(1)')
        mk.addRule(target, prerequisites, recipe)

        await mk.make('glob.md5.out')
        expect(fs.readFileSync('glob.md5.out', 'utf8')).toEqual('6114f5adc373accd7b2051bd87078f62')
    })
})
