export class passwordResets {
    id: number;
    userId: number;
    otpHash: string;
    expiresAt: Date;
    createdAt: Date;
    consumedAt: Date;

    constructor(id: number, userId: number, otpHash: string, expiresAt: Date, createdAt: Date, consumedAt: Date){
        this.id = id;
        this.userId = userId;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.consumedAt = consumedAt;
    }

    isExpired(): boolean {
        return this.expiresAt < new Date();
    }
}