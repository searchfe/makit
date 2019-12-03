export function delay (second: number) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve()
        }, second)
    })
}
