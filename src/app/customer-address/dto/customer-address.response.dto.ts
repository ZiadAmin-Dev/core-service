import { AddressType } from "../entity/enums";
import { CustomerAddress } from "../entity/customer-address.entity";

// Response DTOs — shapes returned by CustomerAddressService
// (see DOCS/customer-address.md).

export class CustomerAddressResponseDTO {
    id!: number;
    label!: string;
    country!: string;
    city!: string;
    street!: string;
    building!: string;
    apartmentNumber!: string;
    type!: AddressType;
    lat!: number;
    lng!: number;
    isDefault!: boolean;

    static from(address: CustomerAddress): CustomerAddressResponseDTO {
        return {
            id: address.id,
            label: address.label,
            country: address.country,
            city: address.city,
            street: address.street,
            building: address.building,
            apartmentNumber: address.apartmentNumber,
            type: address.type,
            lat: address.lat,
            lng: address.lng,
            isDefault: address.isDefault,
        };
    }
}

export class CustomerAddressInternalResponseDTO {
    id!: number;
    userId!: number;
    label!: string;
    country!: string;
    city!: string;
    street!: string;
    building!: string;
    apartmentNumber!: string;
    lat!: number;
    lng!: number;

    static from(address: CustomerAddress): CustomerAddressInternalResponseDTO {
        return {
            id: address.id,
            userId: address.userId,
            label: address.label,
            country: address.country,
            city: address.city,
            street: address.street,
            building: address.building,
            apartmentNumber: address.apartmentNumber,
            lat: address.lat,
            lng: address.lng,
        };
    }
}
