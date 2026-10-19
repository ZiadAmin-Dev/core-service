import { Knex } from "knex";
import { camelToSnake } from "../../utils/case";
import { ValidationError } from "../../validation/validation.error";

// Decoded form of the opaque `nextCursor` string issued by
// `buildPaginationResult()`: the last row's sort value plus its unique id,
// used as the keyset position and tie-breaker.
export interface DecodedCursor {
    id: string | number;
    value: string | number;
}

export interface PaginationParams {
    cursor?: DecodedCursor;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}


export interface PaginationMeta {
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
}


export type FilterValue = string | number | boolean | Date | Array<string | number | boolean | Date>;

export interface FilterParams{
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'like' | 'nlike' | 'between' | 'nbetween';
    value: FilterValue;
}

// Decode the opaque cursor string back into its keyset position. Anything
// malformed (bad base64, bad JSON, wrong shape) throws `ValidationError`
// (400) — decoding happens in the DTO `@Transform`, so bad cursors fail fast
// at the controller and never reach SQL composition.
export function decodeCursor(raw: unknown): DecodedCursor | undefined {
    if (raw === undefined || raw === null || raw === "") return undefined;
    const badCursor = new ValidationError([{ field: "cursor", message: "Invalid pagination cursor" }]);
    if (typeof raw !== "string") throw badCursor;
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
        throw badCursor;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw badCursor;
    const { id, value } = parsed as Record<string, unknown>;
    if (typeof id !== "string" && typeof id !== "number") throw badCursor;
    if (typeof value !== "string" && typeof value !== "number") throw badCursor;
    return { id, value };
}

// Deterministic keyset pagination: rows strictly after the cursor position,
// ordered by the sort column with `id` as the tie-breaker (ties on the sort
// column would otherwise duplicate or skip rows across pages). Assumes the
// table's unique key is named `id` — true for every current module.
export function applyCursorPagination<T>( query: Knex.QueryBuilder, params: PaginationParams ): Knex.QueryBuilder {
    if(!params.sortBy) {
        return query;
    }
    const dbColumn = camelToSnake(params.sortBy);
    if(params.cursor) {
        const { id, value } = params.cursor;
        const op = params.sortOrder === 'asc' ? '>' : '<';
        query = query.where((qb) => {
            qb.where(dbColumn, op, value).orWhere((tie) => {
                tie.where(dbColumn, value).andWhere("id", ">", id);
            });
        });
    }
    return query.orderBy(dbColumn, params.sortOrder).orderBy("id", "asc").limit(params.limit + 1);
}


// All `filters` arrive pre-validated and fully typed from the controller/DTO
// layer — no string splitting or type casting happens here, only SQL
// composition. `field` is mapped to its DB column the same way `sortBy` is.
export function applyFilters<T>(query: Knex.QueryBuilder, filters: FilterParams[]): Knex.QueryBuilder {
    for (const filter of filters) {
        const column = camelToSnake(filter.field);
        switch (filter.operator) {
            case 'eq': query.where(column, filter.value as string | number | boolean | Date); break;

            case 'gt': query.where(column, '>', filter.value as string | number); break;
            case 'lt': query.where(column, '<', filter.value as string | number); break;
            case 'gte': query.where(column, '>=', filter.value as string | number); break;
            case 'lte': query.where(column, '<=', filter.value as string | number); break;

            case 'in': {
                const arr = filter.value as Array<string | number | boolean | Date>;
                if (arr.length === 0) query.whereRaw('1 = 0'); // Force empty result safely
                else query.whereIn(column, arr);
                break;
            }
            case 'nin': {
                const arr = filter.value as Array<string | number | boolean | Date>;
                if (arr.length === 0) break; // Nothing to exclude
                query.whereNotIn(column, arr);
                break;
            }

            case 'like':
            case 'nlike': {
                const safeValue = String(filter.value).replace(/[%_]/g, '\\$&');

                if (filter.operator === 'like') query.where(column, 'like', `%${safeValue}%`);
                else query.where(column, 'not like', `%${safeValue}%`);
                break;
            }

            case 'between':
            case 'nbetween': {
                const [start, end] = filter.value as [string | number, string | number];

                const safeBounds: [string | number, string | number] =
                    (typeof start === 'number' && typeof end === 'number' && start > end)
                        ? [end, start] : [start, end];

                if (filter.operator === 'between') query.whereBetween(column, safeBounds);
                else query.whereNotBetween(column, safeBounds);
                break;
            }
        }
    }
    return query;
}

export function buildPaginationResult<T>(rows: T[], limit: number, sortBy: string): {data: T[], meta: PaginationMeta} {
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    let nextCursor = null;

    if (hasMore && data.length > 0) {
        const lastItem = data[data.length - 1] as any;
        const payload = { id: lastItem.id, value: lastItem[sortBy] };
        nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64');
    }
    return {
        data,
        meta: {
            nextCursor: nextCursor,
            hasMore: hasMore,
            count: data.length,
        }
    };
}


// Generic DTO-to-params mapper shared by every module's list-query DTO.
// The DTO owns parsing/casting/validation; this is a pure shape mapping with
// no field-specific knowledge — `allowedFields` whitelists which filter keys
// reach the repository.
export function buildFilterParams<F extends object>(
    filter: F | undefined,
    allowedFields: readonly string[],
): FilterParams[] {
    if (!filter) return [];
    const out: FilterParams[] = [];
    const byField = filter as Record<string, Record<string, FilterValue | undefined> | undefined>;
    for (const field of allowedFields) {
        const ops = byField[field];
        if (!ops || typeof ops !== "object") continue;
        for (const [operator, value] of Object.entries(ops)) {
            if (value === undefined) continue;
            out.push({ field, operator: operator as FilterParams["operator"], value });
        }
    }
    return out;
}
