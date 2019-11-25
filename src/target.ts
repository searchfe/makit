const extglob = require('extglob')
const isGlob = require('is-glob')

export type TargetDeclaration = string | RegExp
export enum TargetType {
    glob,
    regexp,
    filepath
}

export class Target {
    private targetType: TargetType
    private _decl: TargetDeclaration
    private rTarget: RegExp

    constructor (target: TargetDeclaration) {
        this._decl = target
        if (typeof target === 'string') {
            if (target.indexOf('(') > -1) {
                // Matching Mode
                this.rTarget = new RegExp('^' + extglob(target).replace(/\(\?:/g, '(') + '$')
            } else {
                // Support Backward reference
                this.rTarget = extglob.makeRe(target)
            }
        } else {
            this.rTarget = target
        }
        this.targetType = target instanceof RegExp
            ? TargetType.regexp
            : (
                isGlob(target) ? TargetType.glob : TargetType.filepath
            )
    }

    public get decl () {
        return this._decl
    }

    public isFilePath (): this is {decl: string} {
        return this.targetType === TargetType.filepath
    }

    public exec (targetFile: string) {
        return this.rTarget.exec(targetFile)
    }
}
