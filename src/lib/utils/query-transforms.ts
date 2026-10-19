import { TransformFnParams } from "class-transformer";

// Shared `@Transform` helpers for query DTOs (used with `validateQuery`).
// Every raw URL query value arrives as a string (or, when the key repeats,
// an array of strings), so filter operators like `in` / `nin` / `between`
// need CSV parsing before class-validator runs.

// Express gives us one string per query value (`"1,2,3"`), or — when the key
// repeats (`?filter[id][in]=1&filter[id][in]=2`) — an array of strings.
// Split on commas, trim, and drop empties so array operators always become
// real arrays before validation runs.
export function splitCsv({ value }: TransformFnParams): unknown {
    if (value === undefined || value === null) return value;
    const parts = (Array.isArray(value) ? value : [value]).flatMap((v) => String(v).split(","));
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// Same as `splitCsv`, then cast each item to a number. Non-numeric items
// become `NaN`, which `@IsInt({ each: true })` validators reject with a
// 400 — fail fast at the controller, never in SQL composition.
export function splitCsvToNumbers({ value }: TransformFnParams): unknown {
    const arr = splitCsv({ value } as TransformFnParams);
    return Array.isArray(arr) ? arr.map((v) => Number(v)) : arr;
}
