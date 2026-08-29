declare namespace Express {
    interface Request {
        correlationId?: string;
        user?: {
            userId: number;
            role: string;
            email: string;
            //for restaurant users only
            restaurantId?: number;
            restaurantRole?: string;
            branchIds?: number[];
        }
    }
}