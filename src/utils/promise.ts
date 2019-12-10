import { Callback } from '../types/callback'

export function fromCallback<T> (fn: (cb: Callback<T>) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        fn(function (err: null | Error, result: T) {
            if (err) reject(err)
            else resolve(result)
        })
    })
}

export function delay (second: number) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve()
        }, second)
    })
}
