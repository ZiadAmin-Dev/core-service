import { Request, Response, NextFunction } from "express";
import { notAuthenticatedError } from "../auth/errors"
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../../app/auth/auth.utils";

export function authnetcation(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.access_token;
    if(!token) throw notAuthenticatedError;
    req.user = verifyAccessToken(token);
    next();
}