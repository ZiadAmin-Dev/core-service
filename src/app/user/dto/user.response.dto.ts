import { SystemRole } from "../user.enums";
import { User } from "../entity/user.entity";

// Response DTOs — shapes returned by UserController (see DOCS/user.md).
// Mirrors toUserResponse() in src/lib/utils/utils.ts without changing it.

export class UserResponseDTO {
    id!: number;
    email!: string;
    phone!: string;
    name!: string;
    systemRole!: SystemRole;
    createdAt!: Date;
    updatedAt!: Date;

    static from(user: User): UserResponseDTO {
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            systemRole: user.systemRole,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}

export class AgentResponseDTO {
    id!: number;
    name!: string;
    phone!: string;

    static from(user: User): AgentResponseDTO {
        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
        };
    }
}
