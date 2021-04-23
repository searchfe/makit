export interface Resolver<T> {
    <T1, T2>(resolve: (value: T | PromiseLike<T>) => T1 | PromiseLike<T1>, reject: (reason: any) => T2 | PromiseLike<T2>): any
}
export interface ErrorFirstCallback<T> {
    (err: null, data?: T): void
    (err: Error): void
}

export class SyncablePromise<T> implements PromiseLike<T> {
    private resolved = false
    private rejected = false
    private reason: any
    private value: any
    constructor(resolver: Resolver<T>) {
        try {
            resolver(
                (value: T | PromiseLike<T>) => this.resolve(value),
                (reason: any) => this.reject(reason)
            )
        } catch (error) {
            this.reject(error)
        }
    }
    then<T1, T2>(
        onFulfilled: ((value: T) => T1 | PromiseLike<T1>),
        onRejected: ((reason: any) => T2 | PromiseLike<T2>) | undefined | null
    ): PromiseLike<T1 | T2> {
        if (this.resolved && !(this.value instanceof Promise)) {
            return new SyncablePromise<T1 | T2>((res) => res(onFulfilled(this.value!)))
        }
        if (onRejected && this.rejected && !(this.value instanceof Promise)) {
            return new SyncablePromise<T1 | T2>((res) => res(onRejected(this.reason!)))
        }
        return new Promise((resolve) => {
            this.resolve = (val: T) => resolve(onFulfilled(val))
            this.reject = (reason: any) => resolve(onRejected ? onRejected(reason) : reason)
        })
    }
    private resolve(value: any) {
        this.resolved = true
        this.value = value
    }
    private reject(reason: any) {
        this.rejected = true
        this.reason = reason
    }
}

export function delay (milliSeconds: number) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(milliSeconds)
        }, milliSeconds)
    })
}

export function isThenable(p: any): p is { then: Function } {
    return p && typeof p.then === 'function'
}