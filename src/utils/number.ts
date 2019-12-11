export function humanReadable (n: number) {
    const [wholePart, decimalPart] = String(n).split('.')
    let result = decimalPart ? '.' + decimalPart : ''
    for (let i = wholePart.length - 1; i >= 0; i--) {
        if (
            wholePart[i] >= '0' && wholePart[i] <= '9' &&
            i < wholePart.length - 1 && (wholePart.length - 1 - i) % 3 === 0
        ) {
            result = ',' + result
        }
        result = wholePart[i] + result
    }
    return result
}

export function relation (lhs: number, rhs: number) {
    if (lhs > rhs) return '>'
    if (lhs < rhs) return '<'
    if (lhs === rhs) return '='
    return '?'
}
