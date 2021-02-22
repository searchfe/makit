import type { Task } from '../task'

export interface Reporter {
    /**
     * 表示开始 make 一个 target
     */
    make (task: Task): void

    /**
     * 表示一个正在 make 的 target 被直接跳过
     */
    skip (task: Task): void

    /**
     * 表示一个正在 make 的 target 的 recipe 被执行完成
     */
    made (task: Task): void
}
