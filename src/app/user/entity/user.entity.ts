import { SystemRole } from "./enums";

export class User {
    id: number;
    email: string;
    phone: string;
    name: string;
    passwordHash: string;
    systemRole: SystemRole;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<User>) {
        this.id = data.id!;
        this.email = data.email!;
        this.phone = data.phone!;
        this.name = data.name!;
        this.passwordHash = data.passwordHash!;
        this.systemRole = data.systemRole!;
        this.deletedAt = data.deletedAt ?? null;
        this.createdAt = data.createdAt ?? new Date();
        this.updatedAt = data.updatedAt ?? new Date();
    }
}