import { Request, Response, NextFunction } from "express";
import { notAuthenticated } from "../auth/errors"
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../../app/auth/auth.utils";

export function authnetcation(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.access_token;
    if(!token) throw notAuthenticated;

    req.user = verifyAccessToken(token);
    next();
}