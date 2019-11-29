import { Schedule } from './schedule'
import { Context } from '../context'
import { SingleSchedule } from './single-schedule'
import { Prerequisite, TargetHandler } from '../prerequisites'

export class SequentialSchedule implements Schedule {
    constructor (private tasks: Prerequisite[]) {}

    public async map<T> (ctx: Context, fn: TargetHandler<T>): Promise<T[]> {
        const results: T[] = []
        for (const task of this.tasks) {
            if (SequentialSchedule.is(task)) {
                results.push(...await task.map(ctx, fn))
            } else {
                results.push(...await new SingleSchedule(task).map(ctx, fn))
            }
        }
        return results
    }

    public static is (val: any): val is SequentialSchedule {
        return val instanceof SequentialSchedule
    }
}

export function series (...args: Prerequisite[]) {
    return new SequentialSchedule(args)
}
