declare module "y-protocols/awareness" {
  import * as Y from 'yjs'
  import { Observable } from 'lib0/observable'

  export class Awareness extends Observable<string> {
    constructor(doc: Y.Doc)
    doc: Y.Doc
    clientID: number
    states: Map<number, Record<string, any>>
    setLocalStateField(field: string, value: any): void
    getLocalState(): Record<string, any> | null
    getStates(): Map<number, Record<string, any>>
    on(name: 'change' | 'update', f: (changes: any, origin: any) => void): void
    off(name: 'change' | 'update', f: (changes: any, origin: any) => void): void
  }

  export function encodeAwarenessUpdate(awareness: Awareness, clients: number[]): Uint8Array
  export function applyAwarenessUpdate(awareness: Awareness, update: Uint8Array, origin: any): void
}
declare module "y-protocols/sync"
declare module "y-protocols/auth"
declare module "y-protocols/cursor"