/**
 * 简单的队列实现
 *
 * Array.prototype.shift 在数组较大时耗时明显增加，因此用 Set 实现。
 * 注意：重复元素入队会被忽略
 */
export class Queue<T> {
    data: Set<T>
    size = 0

    constructor () {
        this.data = new Set()
    }

    push (item: T): void {
        this.data.add(item)
        this.size = this.data.size
    }

    peek (): T | undefined {
        return this.data.values().next().value
    }

    pop (): T | undefined {
        if (!this.data.size) return
        const item = this.peek()!
        this.data.delete(item)
        this.size--
        return item
    }
}
