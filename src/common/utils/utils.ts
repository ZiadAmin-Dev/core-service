import { User } from "../../app/user/entity/user.entity";

export function mintuesToMilliseconds(minutes: number): number {
    return minutes * 60 * 1000;
}

export function hoursToMilliseconds(hours: number): number {
    return hours * 60 *60 * 1000;
}

export function daysToMilliseconds(days: number): number {
    return days * 24 *  60 * 60 * 1000;
}

export function toUserResponse(user: User) {
    return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        systemRole: user.systemRole,
        createdAt: user.createdAt,
    };
}