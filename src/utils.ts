import { v4 as uuidV4 } from 'uuid';

export function uuid() {
    return uuidV4();
}

export const isMongoId = (id: string) => {
    return /^[a-f\d]{24}$/i.test(id);
};

export const getImageUrlFromBlob = (blob: Blob): string => {
    const URLObj = window.URL || window.webkitURL;
    return URLObj.createObjectURL(blob);
};

export const getRandomHex = (size: number): string => {
    const result = [];
    const hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    for (let n = 0; n < size; n++) {
        result.push(hexRef[Math.floor(Math.random() * 16)]);
    }
    return result.join('');
};



export const capitalize = (str: string) => {
    if (!str) {
        return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
};

export function debounce(func: (...argv: unknown[]) => void, timeout = 300) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: unknown[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

export const isDesktop = () => {
    return '__TAURI_INTERNALS__' in window;
};

export const isDefined = <T = unknown>(value: T | undefined | null): value is T => typeof value !== 'undefined';

export const isDev = () => !process.env['NX_ENVIRONMENT'] || process.env['NX_ENVIRONMENT'] === 'development';

export const apiUrl = () => process.env['NX_API_URL'] || 'http://localhost:4000';

export function convertType(value: any) {
    try {
        return new Function('return ' + value + ';')();
    } catch (e) {
        return value;
    }
}

export const minToMS = (min: number) => min * 60 * 1000;

export const switchCase =
    <T = unknown>(cases: Record<string | number, T>) =>
        (key: string | number): T =>
            cases[key] || (cases['default'] && cases['default']);

export const getLast = <T>(arr: T[] = []) => arr.slice(-1).pop();

export const getFirst = <T>(arr: T[] = []) => arr[0];

export const trackByObjectKey = (index: number, item: { key: string; [key: string]: any }) => item.key;

export const trackByObjectId = (index: number, item: { _id: string; [key: string]: any }) => item._id;

export const sortByNameOrCreatedAt = (
    a: { createdAt: number; name?: string },
    b: { createdAt: number; name?: string }
) => {
    if (a.name && b.name) {
        return a.name.localeCompare(b.name);
    }

    if (a.createdAt < b.createdAt) {
        return 1;
    }

    return -1;
};

export const arrayToObj = <T extends { [key: string]: string & any }>(array: T[], key = '_id'): Record<string, T> =>
    array.reduce(
        (memo, item) => ({
            ...memo,
            [item[key]]: item,
        }),
        {}
    );
