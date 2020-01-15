import { Stats, MakeDirectoryOptions } from 'fs'

/**
 * FileSystem API 集合。
 *
 * 是 memory-fs 和 Node.js 的交集。以下方法都是 makit 的依赖，要尽量少足够 makit 工作即可。
 */
export interface FileSystem {
    stat(path: string): Promise<Stats>
    statSync(path: string): Stats;

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
