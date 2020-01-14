import { Document } from '../db'
import { TimeStamp } from './time-stamp'

interface MTimeEntry {
    mtimeMs: TimeStamp
    time: TimeStamp
}

export interface MTimeDocument extends Document<MTimeEntry> {}
