export function normalizeToArray<T> (arr: T[] | T): T[] {
    if (Array.isArray(arr)) return arr
    return [arr]
}
