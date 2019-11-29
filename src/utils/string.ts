export function inline (str: string) {
    return str.split('\n').map(x => x.trim()).join(' ')
}

export function limit (str: string, len = 100) {
    return str.length > len ? str.slice(0, len - 3) + '...' : str
}
