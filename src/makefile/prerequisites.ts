import { Context } from '../context'
import { inline } from '../utils/string'
import { inspect } from 'util'

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

export type ResolvedItem = string | string[]
export type Resolver = (context: Context) => ResolvedItem
export type PrerequisitesDeclaration = ResolvedItem | Resolver | PrerequisiteArray
export interface PrerequisiteArray extends Array<PrerequisitesDeclaration> {}

export class Prerequisites {
    private dynamicDependencies: Map<string, Set<string>> = new Map()
    private decl: PrerequisitesDeclaration

    public constructor (decl: PrerequisitesDeclaration) {
        this.decl = decl
    }

    public getPrerequisites (ctx: Context): string[] {
        const results: string[] = []
        this.addRequisites(ctx, this.decl, results)
        return results
    }

    addRequisites<T> (ctx: Context, decl: PrerequisitesDeclaration, results: string[]) {
        if (typeof decl === 'string') {
            results.push(decl.match(/\$\d/)
                // 存在分组匹配，则从 match 数组获得匹配的分组
                ? decl.replace(/\$(\d+)/g, (_, i) => ctx.match![i])
                : decl
            )
        } else if (Array.isArray(decl)) {
            for (const item of decl) this.addRequisites(ctx, item, results)
        } else if (typeof decl === 'function') {
            this.addRequisites(ctx, decl(ctx), results)
        } else {
            throw new Error('invalid prerequisite:' + decl)
        }
    }

    [inspectSymbol] () {
        return inline(inspect(this.decl))
    }
}
