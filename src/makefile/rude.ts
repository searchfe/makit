import { Context } from '../context'
import { Logger } from '../utils/logger'

export const rudeExtname = '.rude.dep'

export function getTargetFromDependency (dependencyFile: string) {
    return dependencyFile.slice(0, -rudeExtname.length)
}

export function getDependencyFromTarget (dependencyFile: string) {
    return dependencyFile + rudeExtname
}

export function isRudeDependencyFile (target: string) {
    return target.slice(-rudeExtname.length) === rudeExtname
}

export function dynamicPrerequisites (ctx: Context): string[] {
    const file = ctx.targetFullPath()

    let fileContent = ''
    try {
        fileContent = ctx.readFileSync(file, 'utf8')
    } catch (err) {
        if (err.code === 'ENOENT') return []
        Logger.getOrCreate().verbose('dynamic deps', 'while reading', file, err)
        throw err
    }
    let json = []
    try {
        json = JSON.parse(fileContent)
    } catch (err) {
        Logger.getOrCreate().warning('dynamic deps', 'corrupted', file, err.message, 'removing...')
        // remove corrupted dep file
        ctx.unlinkSync(file)
    }
    return json
}
