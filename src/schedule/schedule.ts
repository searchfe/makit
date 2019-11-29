import { Context } from '../context'
type TargetHandler<T> = (target: string) => T

export interface Schedule {
    map<T>(ctx: Context, fn: TargetHandler<T>): Promise<T[]>
}
