import bcrypt from "bcrypt";
import { env } from "../../common/config/env";
import jwt, { SignOptions } from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {

    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export function createAccessToken(payload: JwtPayload) : string {
    const options : SignOptions = {expiresIn: Number(env.jwt.accessExpiresIn)}
    return jwt.sign(payload,env.jwt.accessSecret, options);
}

export function createRefreshToken(payload: JwtPayload) : string {
    const options : SignOptions = {expiresIn: Number(env.jwt.refreshExpiresIn)}
    return jwt.sign(payload,env.jwt.refreshSecret, options);
}