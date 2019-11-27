import { Callback } from './callback'

export function fromCallback<T> (fn: (cb: Callback<T>) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        fn(function (err: null | Error, result: T) {
            if (err) reject(err)
            else resolve(result)
        })
    })
}
