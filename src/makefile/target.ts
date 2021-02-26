import { inline } from '../utils/string'
import { inspect } from 'util'

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom') || 'inspect'
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
    private rTarget?: RegExp
    private glob?: string

    constructor (target: TargetDeclaration) {
        this._decl = target
        if (typeof target === 'string') {
            if (target.indexOf('(') > -1) {
                // Contains matching groups
                this.rTarget = new RegExp('^' + extglob(target).replace(/\(\?:/g, '(') + '$')
            } else {
                this.glob = target
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

    public exec (targetFile: string): RegExpExecArray | null {
        if (this.rTarget) return this.rTarget.exec(targetFile)
        return extglob.isMatch(targetFile, this.glob) ? Target.execArrayFromString(targetFile) : null
    }

    [inspectSymbol] () {
        return inline(inspect(this._decl))
    }

    private static execArrayFromString (str: string): RegExpExecArray {
        const arr = [str] as RegExpExecArray
        arr.input = str
        arr.index = 0
        return arr
    }
}
