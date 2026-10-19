import { UserResponseDTO } from "../../user/dto/user.response.dto";
import { Restaurant } from "../../restaurant/entity/restaurant.entity";

// Response DTOs — shapes returned by AuthService via AuthController
// (see DOCS/auth.md). Tokens are opaque JWT strings.

export class RegisterResponseDTO {
    message!: string;
    accessToken!: string;
    refreshToken!: string;
    user!: UserResponseDTO;
    restaurant?: Restaurant;

    static from(data: {
        message: string;
        accessToken: string;
        refreshToken: string;
        user: UserResponseDTO;
        restaurant?: Restaurant;
    }): RegisterResponseDTO {
        return {
            message: data.message,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
            restaurant: data.restaurant,
        };
    }
}

export class LoginResponseDTO {
    message!: string;
    accessToken!: string;
    refreshToken!: string;
    user!: UserResponseDTO;

    static from(data: {
        message: string;
        accessToken: string;
        refreshToken: string;
        user: UserResponseDTO;
    }): LoginResponseDTO {
        return {
            message: data.message,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
        };
    }
}

export class MessageResponseDTO {
    message!: string;

    static from(message: string): MessageResponseDTO {
        return { message };
    }
}

export class RefreshResponseDTO {
    accessToken!: string;

    static from(accessToken: string): RefreshResponseDTO {
        return { accessToken };
    }
}
