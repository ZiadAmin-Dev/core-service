import { IsEmail, IsEnum, IsString, IsStrongPassword, MaxLength, MinLength, IsPhoneNumber, IsNotEmpty, isEAN, Length, minLength, IsOptional } from "class-validator";
import { SystemRole } from "../entity/enums";

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