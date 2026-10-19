import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from "class-validator";
import { decodeCursor, DecodedCursor, PaginationParams } from "./cursor-pagination";

// Shared pagination contract for every list-query DTO (`GET /<modules>/`).
// Module DTOs `extend` this class and add only their own `filter` (+ narrow
// `sortBy` to their allowed fields). Parsing/casting/validation all happen
// here via `validateQuery`, so services/repositories keep receiving clean,
// fully-typed `PaginationParams`.
//
// Note on `sortBy`: the base only guarantees `string`. Each module DTO
// redeclares it with its own `@IsIn([...])` whitelist — both validators run
// (base `@IsString` + module `@IsIn`), so invalid values still fail with 400.

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_BY = "createdAt";

export class BasePaginationQueryDTO {
    // Opaque `nextCursor` from a previous page. Decoded + shape-checked here
    // (`decodeCursor` throws 400 on anything malformed); empty stays undefined.
    @IsOptional()
    @Transform(({ value }) => decodeCursor(value))
    @IsObject()
    cursor?: DecodedCursor;

    // Explicit `@Type(() => Number)` (not implicit conversion) so `"25"` ->
    // `25` works under both `tsx` and `tsc` (see restaurant.query.dto.ts).
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(MAX_LIMIT)
    limit: number = DEFAULT_LIMIT;

    @IsOptional()
    @IsString()
    sortBy: string = DEFAULT_SORT_BY;

    @IsOptional()
    @IsIn(["asc", "desc"])
    sortOrder: "asc" | "desc" = "asc";

    toPaginationParams(): PaginationParams {
        return {
            cursor: this.cursor,
            limit: this.limit,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder,
        };
    }
}
