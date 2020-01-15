import { Context } from '../context'
import { Schedule } from './schedule'
import { SequentialSchedule } from './sequential-schedule'
import { ConcurrentSchedule } from './concurrent-schedule'
import { Resolver, TargetHandler } from '../models/prerequisites'

export class SingleSchedule implements Schedule {
    constructor (private task: string | Resolver) {}

    public async map<T> (ctx: Context, fn: TargetHandler<T>): Promise<T[]> {
        if (typeof this.task === 'string') {
            // 存在分组匹配
            if (this.task.match(/\$\d/)) {
                return [
                    // 从 match 数组获得匹配的分组
                    await fn(this.task.replace(
                        /\$(\d+)/g,
                        (_, i) => ctx.match![i])
                    )
                ]
            }
            return [await fn(this.task)]
        }
        if (SequentialSchedule.is(this.task)) {
            return this.task.map<T>(ctx, fn)
        }
        if (typeof this.task === 'function') {
            const children = await this.task(ctx)
            if (Array.isArray(children)) {
                return new ConcurrentSchedule(children).map(ctx, fn)
            } else {
                return new SingleSchedule(children).map(ctx, fn)
            }
        }
        throw new Error('invalid prerequisite:' + this.task)
    }
}
