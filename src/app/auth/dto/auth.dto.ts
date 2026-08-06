import { IsEmail, IsEnum, IsString, IsStrongPassword, MaxLength, MinLength, IsPhoneNumber, IsNotEmpty, isEAN, Length } from "class-validator";
import { SystemRole } from "../../user/entity/enums";

export class RegisterDTO {
    @IsEmail()
    email!: string;

    @IsString()
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
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter and one number.'
    })
    password!: string;

    @IsEnum(SystemRole)
    role!: SystemRole;
}

export class LoginDTO {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()    
    password!: string;
}

export class ForgetPasswordDTO {

    @IsEmail()
    email!: string;
}

export class ResetPasswordDTO {

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()    
    @Length(6, 6, { message: 'OTP must be 6 characters long.' })
    otp!: string;

    @IsString()
    @IsStrongPassword({
        minLength: 8, 
        minUppercase: 1, 
        minLowercase: 1, 
        minNumbers: 1,
        minSymbols: 0
    }, {
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter and one number.'
    })
    newPassword!: string;
}