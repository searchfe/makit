export function fromCallback<T> (fn: (cb: Callback<T>) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        fn(function (err: null | Error, result?: T) {
            if (err) reject(err)
            else resolve(result!)
        })
    })
}

export function delay (milliSeconds: number) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(milliSeconds)
        }, milliSeconds)
    })
}

export type Callback<T> = (err: null | Error, result?: T) => void
