// Generic case-conversion helpers (pure string functions, no dependencies).

export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
