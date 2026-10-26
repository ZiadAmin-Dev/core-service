import { Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    ValidateNested,
} from "class-validator";
import { buildFilterParams, FilterParams } from "../../../lib/http/pagination/cursor-pagination";
import { BasePaginationQueryDTO, DEFAULT_SORT_BY } from "../../../lib/http/pagination/base-query.dto";
import { splitCsv, splitCsvToNumbers } from "../../../lib/utils/query-transforms";
import { RestaurantStatus } from "../entity/enums";

// Gatekeeper for `GET /restaurants/`. Every raw URL query value arrives as a
// string (or nested string map). This DTO parses, casts, and validates all of
// it up front via `validateQuery`, so the service/repository layers only ever
// see clean, fully-typed `PaginationParams` / `FilterParams`.
//
//   GET /api/restaurants?limit=25&sortBy=name&filter[status][eq]=active&filter[id][in]=1,2,3

export const ALLOWED_SORT_FIELDS = ["createdAt", "name", "status"] as const;
export const ALLOWED_FILTER_FIELDS = ["id", "status", "name"] as const;

// Numeric operators for the `id` filter field. `@Type(() => Number)` is explicit
// (not implicit conversion) so casting works under both `tsx` and `tsc`.
class IdFilterDTO {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    eq?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    gt?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    lt?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    gte?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    lte?: number;

    @IsOptional()
    @Transform(splitCsvToNumbers)
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    in?: number[];

    @IsOptional()
    @Transform(splitCsvToNumbers)
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    nin?: number[];

    @IsOptional()
    @Transform(splitCsvToNumbers)
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsInt({ each: true })
    @IsPositive({ each: true })
    between?: number[];

    @IsOptional()
    @Transform(splitCsvToNumbers)
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsInt({ each: true })
    @IsPositive({ each: true })
    nbetween?: number[];
}

// Enum operators for the `status` filter field.
class StatusFilterDTO {
    @IsOptional()
    @IsEnum(RestaurantStatus)
    eq?: RestaurantStatus;

    @IsOptional()
    @Transform(splitCsv)
    @IsArray()
    @IsEnum(RestaurantStatus, { each: true })
    in?: RestaurantStatus[];

    @IsOptional()
    @Transform(splitCsv)
    @IsArray()
    @IsEnum(RestaurantStatus, { each: true })
    nin?: RestaurantStatus[];
}

// String operators for the `name` filter field.
class NameFilterDTO {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    eq?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    like?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    nlike?: string;

    @IsOptional()
    @Transform(splitCsv)
    @IsArray()
    @ArrayMaxSize(100)
    @ArrayMinSize(1)
    @IsString({ each: true })
    in?: string[];

    @IsOptional()
    @Transform(splitCsv)
    @IsArray()
    @ArrayMaxSize(100)
    @ArrayMinSize(1)
    @IsString({ each: true })
    nin?: string[];
}

class RestaurantFilterDTO {
    @IsOptional()
    @ValidateNested()
    @Type(() => IdFilterDTO)
    id?: IdFilterDTO;

    @IsOptional()
    @ValidateNested()
    @Type(() => StatusFilterDTO)
    status?: StatusFilterDTO;

    @IsOptional()
    @ValidateNested()
    @Type(() => NameFilterDTO)
    name?: NameFilterDTO;
}

export class ListRestaurantsQueryDTO extends BasePaginationQueryDTO {
    // Narrow the base `sortBy` (plain string) to this module's whitelist.
    // Both validators run: base `@IsString` + this `@IsIn`.
    @IsOptional()
    @IsIn(ALLOWED_SORT_FIELDS)
    override sortBy: string = DEFAULT_SORT_BY;

    @IsOptional()
    @ValidateNested()
    @Type(() => RestaurantFilterDTO)
    filter?: RestaurantFilterDTO;

    // The DTO already cast every value (`"25"` -> `25`, `"1,2,3"` ->
    // `[1, 2, 3]`), so this delegates to the shared generic mapper.
    toFilterParams(): FilterParams[] {
        return buildFilterParams(this.filter, ALLOWED_FILTER_FIELDS);
    }
}
