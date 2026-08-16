import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
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