import { Context } from './context'

type PrerequisitesResolver = (context: Context) => (string[] | string | Promise<string | string[]>)
type prerequisitesItem = string | PrerequisitesResolver
export type PrerequisitesDeclaration = prerequisitesItem | prerequisitesItem[]

const emptySet = new Set()

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
    private dynamicDependencies: Map<string, Set<string>> = new Map()

    public constructor (decl: PrerequisitesDeclaration) {
        if (!Array.isArray(decl)) decl = [ decl ]
        this.resolvers = decl.map(normalizeResolver)
    }

    public async evaluate (ctx: Context) {
        const result = []
        for (const resolver of [...this.resolvers, ...this.getDynamicResolvers(ctx.target)]) {
            const deps = await resolver(ctx)
            if (Array.isArray(deps)) {
                result.push(...deps)
            } else {
                result.push(deps)
            }
        }
        return result
    }

    public getDynamicResolvers (target: string) {
        const deps = this.dynamicDependencies.get(target) || emptySet
        return [...deps].map(dep => () => dep)
    }

    public addDynamicDependency (target: string, dep: string) {
        if (!this.dynamicDependencies.has(target)) {
            this.dynamicDependencies.set(target, new Set())
        }
        const dependencies = this.dynamicDependencies.get(target)
        dependencies.add(dep)
    }

    public clearDynamicDependency (target: string) {
        this.dynamicDependencies.delete(target)
    }
}
