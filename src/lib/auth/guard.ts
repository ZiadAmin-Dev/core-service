import { Request, Response, NextFunction } from "express";
import { notAuthenticatedError } from "../auth/errors"
import { verifyAccessToken } from "../../app/auth/auth.utils";

export function authentication(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.access_token;
    if(!token) throw notAuthenticatedError;
    req.user = verifyAccessToken(token);
    if(!req.user) throw notAuthenticatedError;
    next();
}