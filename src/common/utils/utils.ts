import { User } from "../../app/user/entity/user.entity";

export function toUserResponse(user: User) {
    return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        systemRole: user.systemRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}