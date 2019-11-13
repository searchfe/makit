import { resolve } from 'path'
import { writeFile, writeFileSync, readFile, readFileSync } from 'fs-extra'

export class Context {
    public readonly target: string
    public dependencies: string[]
    public readonly match

    private readonly root: string

    constructor ({ target, match, root, dependencies = [] }) {
        this.root = root
        this.match = match
        this.target = target
        this.dependencies = dependencies
    }

    async writeSync (filepath: string) {
        return writeFileSync(this.toFullPath(filepath))
    }

    async write (filepath: string) {
        return writeFile(this.toFullPath(filepath))
    }

    async readSync (filepath: string) {
        return readFileSync(this.toFullPath(filepath))
    }

    async read (filepath: string) {
        return readFile(this.toFullPath(filepath))
    }

    async readDependency (i: number = 0) {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return readFile(this.dependencyFullPath(i), 'utf8')
    }

    async readDependencySync (i: number = 0) {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return readFileSync(this.dependencyFullPath(i), 'utf8')
    }

    targetFullPath () {
        return this.toFullPath(this.target)
    }

    targetPath () {
        return this.target
    }

    dependencyFullPath (i: number = 0) {
        return this.toFullPath(this.dependencies[i])
    }

    dependencyPath (i: number = 0) {
        return this.dependencies[i]
    }

    writeTarget (content: string) {
        return writeFile(this.targetFullPath(), content)
    }

    writeTargetSync (content: string) {
        return writeFileSync(this.targetFullPath(), content)
    }

    private toFullPath (filename: string) {
        return resolve(this.root, filename)
    }
}
