import { IsEmail, IsEnum, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { systemRole } from "../../user/entity/enums";

export class registerDTO {
    @IsEmail()
    email!: string;

    @MinLength(10)
    @MaxLength(11)
    phone!: string;

    @IsString()
    @MinLength(1)
    name!: string;

    @IsString()
    @IsStrongPassword({
        minLength: 8, 
        minUppercase: 1, 
        minLowercase: 1, 
        minNumbers: 1,
        minSymbols: 0
    }, {
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
    })
    password!: string;

    @IsEnum(systemRole)
    role!: systemRole;
}