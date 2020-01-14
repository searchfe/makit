import { Schedule } from './schedule'
import { Context } from '../context'
import { inspect } from 'util'
import { SingleSchedule } from './single-schedule'
import { ConcurrentSchedule } from './concurrent-schedule'
import { PrerequisiteArray, TargetHandler } from '../models/prerequisites'

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'

export class SequentialSchedule implements Schedule {
    constructor (private tasks: PrerequisiteArray) {}

    public async map<T> (ctx: Context, fn: TargetHandler<T>): Promise<T[]> {
        const results: T[] = []
        for (const task of this.tasks) {
            if (SequentialSchedule.is(task)) {
                results.push(...await task.map(ctx, fn))
            } else if (Array.isArray(task)) {
                results.push(...await new ConcurrentSchedule(task).map(ctx, fn))
            } else {
                results.push(...await new SingleSchedule(task).map(ctx, fn))
            }
        }
        return results
    }

    public static is (val: any): val is SequentialSchedule {
        return val instanceof SequentialSchedule
    }

    [inspectSymbol] () {
        const deps = this.tasks.map(task => inspect(task))
        return `series(${deps.join(', ')})`
    }
}

export function series (...args: PrerequisiteArray) {
    return new SequentialSchedule(args)
}
