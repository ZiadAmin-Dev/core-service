declare namespace Express {
    interface Request {
        correlationId?: string;
        user?: {
            userId: number;
            role: string;
            email: string;
        }
    }
}