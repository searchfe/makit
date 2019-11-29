import { series } from './schedule/sequential-schedule'
import { Logger } from './utils/logger'

export const rudeExtname = '.rude.dep'

export function getTargetFromDependency (dependencyFile: string) {
    return dependencyFile.slice(0, -rudeExtname.length)
}

export function getDependencyFromTarget (dependencyFile: string) {
    return dependencyFile + rudeExtname
}

export function dynamicPrerequisites () {
    return series('$0' + rudeExtname, async ctx => {
        const depTarget = ctx.targetFullPath() + rudeExtname
        try {
            return JSON.parse(await ctx.readFile(depTarget, 'utf8'))
        } catch (err) {
            Logger.getOrCreate().verbose('error', 'while reading', depTarget, err)
            if (err.code === 'ENOENT') return []
            throw err
        }
    })
}

export async function dependencyRecipe (ctx) {
    try {
        await ctx.unlink(ctx.targetFullPath())
    } catch (err) {
        if (err.code === 'ENOENT') return
        throw err
    }
}
