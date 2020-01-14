import { Schedule } from './schedule'
import { flatten } from 'lodash'
import { SequentialSchedule } from './sequential-schedule'
import { SingleSchedule } from './single-schedule'
import { Context } from '../context'
import { PrerequisiteArray, TargetHandler } from '../models/prerequisites'

export class ConcurrentSchedule implements Schedule {
    constructor (private tasks: PrerequisiteArray) {}

    public async map<T> (ctx: Context, fn: TargetHandler<T>): Promise<T[]> {
        return Promise
            .all(this.tasks.map(task => {
                if (SequentialSchedule.is(task)) {
                    return task.map(ctx, fn)
                } else if (Array.isArray(task)) {
                    return new ConcurrentSchedule(task).map(ctx, fn)
                }
                return new SingleSchedule(task).map(ctx, fn)
            }))
            .then(flatten)
    }
}
