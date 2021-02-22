import { Makefile } from '../../src/index'
import { createEnv } from '../stub/create-env'

describe('graph', function () {
    let mk: Makefile
    beforeEach(() => {
        const env = createEnv({ logLevel: 1 })
        mk = env.mk
    })

    it('should print single target', async function () {
        mk.addRule('a.js', [], () => void (0))
        await mk.make('a.js')
        expect(mk.dependencyGraphString()).toEqual('a.js\n')
    })

    it('should print a single dependency', async function () {
        mk.addRule('a.min.js', ['a.js'], () => void (0))
        mk.addRule('a.js', [], () => void (0))

        await mk.make('a.min.js')
        expect(mk.dependencyGraphString()).toEqual(`a.min.js
└─ a.js
`
        )
    })

    it('should print multiple dependencies', async function () {
        mk.addRule('a.min.js', ['a.js', 'b.js'], () => void (0))
        mk.addRule('a.js', [], () => void (0))
        mk.addRule('b.js', [], () => void (0))

        await mk.make('a.min.js')
        expect(mk.dependencyGraphString()).toEqual(`a.min.js
├─ a.js
└─ b.js
`
        )
    })

    it('should print recursive dependencies', async function () {
        mk.addRule('a.min.js', ['a.js'], () => void (0))
        mk.addRule('a.js', ['b.js'], () => void (0))
        mk.addRule('b.js', [], () => void (0))

        await mk.make('a.min.js')
        expect(mk.dependencyGraphString()).toEqual(`a.min.js
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

        await mk.make('top')
        expect(mk.dependencyGraphString()).toEqual(`top
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
