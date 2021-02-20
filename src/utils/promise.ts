export function delay (milliSeconds: number) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(milliSeconds)
        }, milliSeconds)
    })
}

export type Callback<T> = (err: null | Error, result?: T) => void
