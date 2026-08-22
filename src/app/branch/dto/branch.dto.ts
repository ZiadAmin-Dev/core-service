import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
    IsOptional
} from "class-validator";
import { Currency } from "../entity/enums";

export class CreateBranchDTO {
    @IsString()
    @IsNotEmpty()
    countryCode!: string;

    @IsString()
    @IsNotEmpty()
    addressText!: string;

    @IsString()
    @IsNotEmpty()
    label!: string;

    @IsNumber()
    lat!: number;

    @IsNumber()
    lng!: number;

    @IsString()
    @IsNotEmpty()
    opensAt!: string;

    @IsString()
    @IsNotEmpty()
    closesAt!: string;

    @IsInt()
    @Min(0)
    deliveryRadius!: number;

    @IsEnum(Currency)
    currency!: Currency;
}

export class UpdateBranchDTO{
    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsString()
    addressText?: string;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;

    @IsOptional()
    @IsString()
    opensAt?: string;

    @IsOptional()
    @IsString()
    closesAt?: string;

    @IsOptional()
    @IsNumber()
    deliveryRadius?: number;

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;

    @IsOptional()
    @IsBoolean()
    acceptOrders?: boolean;

}

export class UpdateBranchStatusDTO {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    commission?: number;
}