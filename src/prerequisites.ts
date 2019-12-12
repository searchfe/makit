import { Context } from './context'
import { inline } from './utils/string'
import { inspect } from 'util'
import { normalizeToArray } from './utils/array'
import { Schedule } from './schedule/schedule'
import { SequentialSchedule } from './schedule/sequential-schedule'
import { ConcurrentSchedule } from './schedule/concurrent-schedule'

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

export type TargetHandler<T> = (target: string) => T
export type Resolver = (context: Context) => (string[] | string | Promise<string | string[]>)
export type PrerequisiteItem = string | Resolver | SequentialSchedule | PrerequisiteArray
export interface PrerequisiteArray extends Array<PrerequisiteItem> {}
export type PrerequisitesDeclaration = PrerequisiteItem | PrerequisiteArray

export class Prerequisites {
    private dynamicDependencies: Map<string, Set<string>> = new Map()
    private schedule: Schedule
    private _decl: PrerequisitesDeclaration

    public constructor (decl: PrerequisitesDeclaration) {
        this._decl = decl
        this.schedule = new ConcurrentSchedule(normalizeToArray(decl))
    }

    public async map<T> (ctx: Context, fn: TargetHandler<T>) {
        return this.schedule.map<T>(ctx, fn)
    }

    [inspectSymbol] () {
        return inline(inspect(this._decl))
    }
}
