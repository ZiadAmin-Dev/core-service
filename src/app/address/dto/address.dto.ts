import {
    IsBoolean,
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    IsNumber
} from "class-validator";
import { Type } from "../entity/enums";

export class AddressDTO {

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    label!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(15)
    country!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street!: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    building?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    apartmentNumber?: string;

    @IsEnum(Type)
    type!: Type;

    @IsLatitude()
    lat!: number;

    @IsLongitude()
    lng!: number;

    @IsBoolean()
    isDefault!: boolean;
}

export class UpdateAddressDTO {

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    label?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(15)
    country?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    building?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    apartmentNumber?: string;

    @IsOptional()
    @IsEnum(Type)
    type?: Type;

    @IsOptional()
    @IsLatitude()
    lat?: number;

    @IsOptional()
    @IsLongitude()
    lng?: number;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}