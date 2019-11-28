/*
 * monotonic increasing Date.now()
 */

let last = Date.now()

export function now () {
    let n = Date.now()
    if (n <= last) {
        n = last + 1
    }
    last = n
    return n
}

export type TimeStamp = number
