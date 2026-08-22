import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";
import { RestaurantStatus } from "../entity/enums"; 

export class UpdateRestaurantDTO {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    logoURL?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    primaryCountry?: string;
}

export class UpdateRestaurantStatusDTO {
    @IsEnum(RestaurantStatus)
    status!: RestaurantStatus;
}