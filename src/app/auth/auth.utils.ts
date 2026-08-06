import bcrypt from "bcrypt";
import { env } from "../../common/config/env";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { hoursToMilliseconds, daysToMilliseconds} from "../../common/utils/utils"

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

export function GenerateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export function verifyAccessToken(token: string): JwtPayload{
    return jwt.verify(token, env.jwt.accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload{
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload
}

export function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    
    const secure = process.env.NODE_ENV === "production";

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure,
        maxAge: hoursToMilliseconds(1),
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: secure,
        maxAge: daysToMilliseconds(7),
        path: "/api/auth/refresh",
    });
}