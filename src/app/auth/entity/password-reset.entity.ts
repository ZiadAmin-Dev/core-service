export class PasswordReset {
    id: number;
    userId: number;
    otpHash: string;
    expiresAt: Date;
    createdAt: Date;
    consumedAt: Date | null;

    constructor(data: Partial<PasswordReset>) {
        this.id = data.id!;
        this.userId = data.userId!;
        this.otpHash = data.otpHash!;
        this.expiresAt = data.expiresAt!;
        this.createdAt = data.createdAt ?? new Date();
        this.consumedAt = data.consumedAt ?? null;
    }

    isExpired(): boolean {
        return this.expiresAt < new Date();
    }
}