import { Context } from './context'

type PrerequisitesResolver = (context: Context) => (string[] | string | Promise<string | string[]>)
type prerequisitesItem = string | PrerequisitesResolver
export type PrerequisitesDeclaration = prerequisitesItem | prerequisitesItem[]

function normalizeResolver (decl: string | PrerequisitesResolver) {
    if (typeof decl === 'string') {
        if (decl.match(/\$\d/)) {
            return ctx => decl.replace(/\$(\d+)/g, (_, i) => ctx.match[i])
        }
        return () => decl
    }
    if (typeof decl === 'function') return decl
    throw new Error('invalid prerequisites resolver:' + decl)
}

export class Prerequisites {
    private resolvers: PrerequisitesResolver[]

    public constructor (decl: PrerequisitesDeclaration) {
        if (!Array.isArray(decl)) decl = [ decl ]
        this.resolvers = decl.map(normalizeResolver)
    }

    public async evaluate (ctx: Context) {
        const result = []
        for (const resolver of this.resolvers) {
            const deps = await resolver(ctx)
            if (Array.isArray(deps)) {
                result.push(...deps)
            } else {
                result.push(deps)
            }
        }
        return result
    }
}
