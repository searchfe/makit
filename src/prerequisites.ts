import { Context } from './context'
import { normalizeToArray } from './utils/array'
import { flatten } from 'lodash'
import { Schedule } from './schedule/schedule'
import { SequentialSchedule } from './schedule/sequential-schedule'
import { ConcurrentSchedule } from './schedule/concurrent-schedule'

export type TargetHandler<T> = (target: string) => T
export type Resolver = (context: Context) => (string[] | string | Promise<string | string[]>)
export type PrerequisiteItem = string | Resolver | SequentialSchedule | PrerequisiteArray
export interface PrerequisiteArray extends Array<PrerequisiteItem> {}
export type PrerequisitesDeclaration = PrerequisiteItem | PrerequisiteArray

const emptySet: Set<string> = new Set()

export class Prerequisites {
    private dynamicDependencies: Map<string, Set<string>> = new Map()
    private schedule: Schedule

    public constructor (decl: PrerequisitesDeclaration) {
        this.schedule = new ConcurrentSchedule(normalizeToArray(decl))
    }

    public async map<T> (ctx: Context, fn: TargetHandler<T>) {
        return Promise
            .all([
                this.schedule.map<T>(ctx, fn),
                Promise.all([...this.getDynamicDependency(ctx.target)].map(target => fn(target)))
            ])
            .then(flatten)
    }

    public getDynamicDependency (target: string): Set<string> {
        return this.dynamicDependencies.get(target) || emptySet
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
