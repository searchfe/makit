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

        let fileContent = ''
        try {
            fileContent = await ctx.readFile(depTarget, 'utf8')
        } catch (err) {
            if (err.code === 'ENOENT') return []
            Logger.getOrCreate().verbose('dynamic deps', 'while reading', depTarget, err)
            throw err
        }
        let json = []
        try {
            json = JSON.parse(fileContent)
        } catch (err) {
            Logger.getOrCreate().warning('dynamic deps', 'corrupted', depTarget, err, 'removing...')
            await ctx.unlink(depTarget)
        }
        return json
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
