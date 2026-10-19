import { Currency } from "../entity/branch.enums";
import { Branch } from "../entity/branch.entity";

// Response DTOs — shapes returned by BranchService via BranchController
// (see DOCS/branch.md).

export class BranchResponseDTO {
    id!: number;
    restaurantId!: number;
    countryCode!: string;
    addressText!: string;
    label!: string;
    lat!: number;
    lng!: number;
    isActive!: boolean;
    opensAt!: string;
    closesAt!: string;
    acceptOrders!: boolean;
    createdAt!: Date;
    updatedAt!: Date;
    deliveryRadius!: number;
    deliveryFee!: number;
    currency!: Currency;
    commission!: number;

    static from(branch: Branch): BranchResponseDTO {
        return {
            id: branch.id,
            restaurantId: branch.restaurantId,
            countryCode: branch.countryCode,
            addressText: branch.addressText,
            label: branch.label,
            lat: branch.lat,
            lng: branch.lng,
            isActive: branch.isActive,
            opensAt: branch.opensAt,
            closesAt: branch.closesAt,
            acceptOrders: branch.acceptOrders,
            createdAt: branch.createdAt,
            updatedAt: branch.updatedAt,
            deliveryRadius: branch.deliveryRadius,
            deliveryFee: branch.deliveryFee,
            currency: branch.currency,
            commission: branch.commission,
        };
    }
}

export class NearbyBranchResponseDTO {
    id!: number;
    restaurantId!: number;
    addressText!: string;
    label!: string;
    lat!: number;
    lng!: number;
    isActive!: boolean;
    acceptOrders!: boolean;
    currency!: Currency;
    restaurantName!: string;
    logoUrl!: string;

    static from(row: NearbyBranchResponseDTO): NearbyBranchResponseDTO {
        return {
            id: row.id,
            restaurantId: row.restaurantId,
            addressText: row.addressText,
            label: row.label,
            lat: row.lat,
            lng: row.lng,
            isActive: row.isActive,
            acceptOrders: row.acceptOrders,
            currency: row.currency,
            restaurantName: row.restaurantName,
            logoUrl: row.logoUrl,
        };
    }
}

export class BranchStatusResponseDTO {
    id!: number;
    isActive!: boolean;
    acceptOrders!: boolean;
    commission!: number;

    static from(branch: Branch): BranchStatusResponseDTO {
        return {
            id: branch.id,
            isActive: branch.isActive,
            acceptOrders: branch.acceptOrders,
            commission: branch.commission,
        };
    }
}

export class BranchInternalResponseDTO {
    id!: number;
    restaurantId!: number;
    restaurantStatus!: string;
    region!: string;
    isActive!: boolean;
    acceptOrders!: boolean;
    deliveryFee!: number;
    commissionBps!: number;
    currency!: Currency;
    lat!: number;
    lng!: number;
    name!: string;
    addressText!: string;

    static from(data: {
        branch: Branch;
        restaurantStatus: string;
    }): BranchInternalResponseDTO {
        return {
            id: data.branch.id,
            restaurantId: data.branch.restaurantId,
            restaurantStatus: data.restaurantStatus,
            region: data.branch.countryCode,
            isActive: data.branch.isActive,
            acceptOrders: data.branch.acceptOrders,
            deliveryFee: data.branch.deliveryFee,
            commissionBps: data.branch.commission,
            currency: data.branch.currency,
            lat: Number(data.branch.lat),
            lng: Number(data.branch.lng),
            name: data.branch.label,
            addressText: data.branch.addressText,
        };
    }
}
