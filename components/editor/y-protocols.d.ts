declare module "y-protocols/awareness" {
  import * as Y from "yjs"
  import { Observable } from "lib0/observable"

  export class Awareness extends Observable<string> {
    constructor(doc: Y.Doc)
    doc: Y.Doc
    clientID: number
    states: Map<number, Record<string, unknown>>
    setLocalStateField(field: string, value: unknown): void
    getLocalState(): Record<string, unknown> | null
    getStates(): Map<number, Record<string, unknown>>
    on(name: "change" | "update", f: (changes: unknown, origin: unknown) => void): void
    off(name: "change" | "update", f: (changes: unknown, origin: unknown) => void): void
  }

  export function encodeAwarenessUpdate(awareness: Awareness, clients: number[]): Uint8Array
  export function applyAwarenessUpdate(
    awareness: Awareness,
    update: Uint8Array,
    origin: unknown
  ): void
}
declare module "y-protocols/sync"
declare module "y-protocols/auth"
declare module "y-protocols/cursor"
