export class File {
    public isPhony: boolean
    public filepath: string

    private constructor (filepath: string, isPhony: boolean) {
        this.filepath = filepath
        this.isPhony = isPhony
    }

    public static create (filepath: string) {
        return new File(filepath, false)
    }
}
