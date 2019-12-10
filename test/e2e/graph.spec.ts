import { Makefile } from '../../src/index'
import { Logger, LogLevel } from '../../src/utils/logger'
import { MemoryFileSystem } from '../../src/fs/memfs'
import { FileSystem } from '../../src/types/fs'

describe('graph', function () {
    let fs: FileSystem
    let mk: Makefile
    beforeEach(() => {
        fs = new MemoryFileSystem()
        fs.mkdirSync(process.cwd(), { recursive: true })
        mk = new Makefile(process.cwd(), fs)
        Logger.getOrCreate().setLevel(LogLevel.error)
    })

    it('should print single target', async function () {
        mk.addRule('a.js', [], () => void (0))
        const make = await mk.make('a.js')
        expect(make.getGraph().toString()).toEqual('a.js\n')
    })

    it('should print a single dependency', async function () {
        mk.addRule('a.min.js', ['a.js'], () => void (0))
        mk.addRule('a.js', [], () => void (0))

        const make = await mk.make('a.min.js')
        expect(make.getGraph().toString()).toEqual(`a.min.js
└─ a.js
`
        )
    })

    it('should print multiple dependencies', async function () {
        mk.addRule('a.min.js', ['a.js', 'b.js'], () => void (0))
        mk.addRule('a.js', [], () => void (0))
        mk.addRule('b.js', [], () => void (0))

        const make = await mk.make('a.min.js')
        expect(make.getGraph().toString()).toEqual(`a.min.js
├─ a.js
└─ b.js
`
        )
    })

    it('should print recursive dependencies', async function () {
        mk.addRule('a.min.js', ['a.js'], () => void (0))
        mk.addRule('a.js', ['b.js'], () => void (0))
        mk.addRule('b.js', [], () => void (0))

        const make = await mk.make('a.min.js')
        expect(make.getGraph().toString()).toEqual(`a.min.js
└─ a.js
   └─ b.js
`
        )
    })

    it('should print a subtree for each reference', async function () {
        mk.addRule('top', ['left', 'right'], () => void (0))
        mk.addRule('left', ['bottom'], () => void (0))
        mk.addRule('right', ['bottom'], () => void (0))
        mk.addRule('bottom', ['bottom1', 'bottom2'], () => void (0))
        mk.addRule('bottom1', [], () => void (0))
        mk.addRule('bottom2', [], () => void (0))

        const make = await mk.make('top')
        expect(make.getGraph().toString()).toEqual(`top
├─ left
│  └─ bottom
│     ├─ bottom1
│     └─ bottom2
└─ right
   └─ bottom
      ├─ bottom1
      └─ bottom2
`
        )
    })
})
