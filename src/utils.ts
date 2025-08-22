import { customAlphabet } from "nanoid";
import { nolookalikesSafe } from "nanoid-dictionary";

export namespace ID {
    const nanoid = customAlphabet(nolookalikesSafe, 14);

    export type IdKinds = 'branch' | 'user' | 'session' | 'form' | 'property' | 'response';

    export function newId(kind: IdKinds): string {
        let prefix = kind.substring(0, 4);

        return prefix + '_' + nanoid();
    }

    export function idKind(id: unknown): IdKinds | null {
        if (typeof id != 'string') {
            return null;
        } else if (id.length <= 5) {
            return null;
        }

        if (id.startsWith('user_')) {
            return 'user';
        } else if (id.startsWith('sess_')) {
            return 'session';
        } else if (id.startsWith('form_')) {
            return 'form';
        } else if (id.startsWith('prop_')) {
            return 'property';
        } else if (id.startsWith('resp_')) {
            return 'response';
        } else if (id.startsWith('bran_')) {
            return 'branch';
        }

        return null;
    }

    export function assertKind(id: unknown, kind: IdKinds): asserts id is string {
        if (idKind(id) !== kind) {
            throw new Error(`Expected ${kind} ID, but found ${idKind(id)} ID instead.`);
        }
    }
}