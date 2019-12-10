import { Stats, MakeDirectoryOptions } from 'fs'

export interface FileSystem {
    stat(path: string): Promise<Partial<Stats>>
    statSync(path: string): Partial<Stats>;

    readFile(path: string, encoding?: string): Promise<string | Buffer>
    readFile(path: string, encoding?: BufferEncoding): Promise<string>

    readFileSync(path: string, encoding: BufferEncoding): string;
    readFileSync(path: string, encoding?: string): string | Buffer;

    writeFile(path: string, data: string | Buffer): Promise<void>;
    writeFileSync(path: string, data: string | Buffer): void;

    mkdir(path: string, options?: number | string | MakeDirectoryOptions | null): Promise<void>;
    mkdirSync(path: string, options?: number | string | MakeDirectoryOptions | null): void;

    unlink(path: string): Promise<void>
    unlinkSync(path: string)

    exists(path: string): Promise<boolean>
    existsSync(path: string): boolean

    utimes(path: string, atime: number, mtime: number): Promise<void>
    utimesSync(path: string, atime: number, mtime: number)
}
