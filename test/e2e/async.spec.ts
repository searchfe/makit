import { Makefile } from '../../src/index'
import { FileSystem } from '../../src/fs/file-system'
import { createEnv } from '../stub/create-env'

describe('async', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        const env = createEnv({ logLevel: 1 })
        fs = env.fs
        mk = env.mk
    })

    it('should support async', async function () {
        fs.writeFileSync('a.js', 'a')
        mk.addRule('async.out', 'a.js', async function () {
            return this.writeTarget(this.dependencyPath())
        })
        await mk.make('async.out')

        expect(fs.readFileSync('async.out', 'utf8')).toEqual('a.js')
    })

    it('should make one file only once', async function () {
        const recipe = jest.fn()

        mk.addRule('a', ['b', 'c'])
        mk.addRule('b', 'd')
        mk.addRule('c', 'd')
        mk.addRule('d', [], recipe as any)

        await mk.make('a')
        expect(recipe).toBeCalledTimes(1)
    })
})
