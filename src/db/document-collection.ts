import { Document } from './document'

/**
 * Document 的集合
 */
export interface DocumentCollection {
    [key: string]: Document<any>;
}
