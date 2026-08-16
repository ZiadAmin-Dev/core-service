import {  IsString, MaxLength, MinLength, IsOptional } from "class-validator";

export class UpdateUserDTO {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(11)
    phone?: string;
}