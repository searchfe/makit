import { Target } from './target'

export class Task {
    public target: Target

    private canceled = false

    constructor (target: Target) {
        this.target = target
    }

    cancel () {
        this.canceled = true
    }

    isCanceled () {
        return this.canceled
    }
}