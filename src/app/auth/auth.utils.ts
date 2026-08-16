import bcrypt from "bcrypt";
import { env } from "../../common/config/env";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { toMs } from "../../common/utils/time";

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

export function createAuthTokens(payload: JwtPayload) {
    return {
        accessToken: createAccessToken(payload),
        refreshToken: createRefreshToken(payload),
    }
}



export async function hashPassword(password: string): Promise<string> {

    return bcrypt.hash(password, env.security.bcryptSaltRounds);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}



export function GenerateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}



export function verifyAccessToken(token: string): JwtPayload{
    return jwt.verify(token, env.jwt.accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload{
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload
}


export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    
    const secure = env.NODE_ENV === "production";

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: secure,
        maxAge: toMs(1, 'h'),
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: secure,
        maxAge: toMs(7,'d'),
        path: "/api/auth/refresh",
    });
}

export function setAccessTokenCookies(res: Response, accessToken: string) {
    
    const secure = env.NODE_ENV === "production";

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: secure,
        maxAge: toMs(1, 'h'),
    });
}
