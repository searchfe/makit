import { BigIntOptions, BigIntStats, Stats, MakeDirectoryOptions } from 'fs'
import { Callback } from './callback'

export interface FileSystemImpl {
    stat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    stat(path: string, options: BigIntOptions, callback: (err: NodeJS.ErrnoException | null, stats: BigIntStats) => void): void;
    statSync(path: string): Stats;
    statSync(path: string, options: BigIntOptions): BigIntStats;

    readFile(path: string, encoding?: string, callback?: (err: Error | null, data: string | Buffer) => void): void;
    readFile(path: string, encoding?: BufferEncoding, callback?: (err: Error | null, data: string) => void): void;

    readFileSync(path: string, encoding: BufferEncoding): string;
    readFileSync(path: string, encoding?: string): string | Buffer;

    writeFile(path: string, data: any, callback: Callback<void>): void;
    writeFileSync(path: string, data: any): void;

    mkdir(path: string, options?: number | string | MakeDirectoryOptions | null, callback?: Callback<void>): void;
    mkdirSync(path: string, options?: number | string | MakeDirectoryOptions | null): void;

    unlink(path: string, callback?: Callback<void>)
    unlinkSync(path: string)

    exists(path: string, callback?: Callback<void>)
    existsSync(path: string)

    utimes(path: string, atime: number, mtime: number, callback?: Callback<void>)
    utimesSync(path: string, atime: number, mtime: number)
}
