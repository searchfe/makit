import { NodeFileSystem } from './nodefs'
import { FileSystem } from '../types/fs'

let instance: FileSystem = new NodeFileSystem()

export function getFileSystem () {
    return instance
}

export function setFileSystem (fs: FileSystem) {
    instance = fs
    return instance
}

export function resetFileSystem () {
    instance = new NodeFileSystem()
    return instance
}
