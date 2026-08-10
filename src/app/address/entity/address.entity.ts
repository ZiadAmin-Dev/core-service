import { Type } from "./enums"

export class Address{
    id: number;
    userId: number;
    label: string;
    country: string;
    city: string;
    street: string;
    building: string;
    apartmentNumber: string;
    type: Type;
    lat: number;
    lng: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<Address>){
        this.id = data.id!;
        this.userId = data.userId!;
        this.label = data.label!;
        this.country = data.country!;
        this.city = data.city!;
        this.street = data.street!;
        this.building = data.building!;
        this.apartmentNumber = data.apartmentNumber!;
        this.type = data.type!;
        this.lat = data.lat!;
        this.lng = data.lng!;
        this.isDefault = data.isDefault!;
        this.createdAt = data.createdAt!;
        this.updatedAt = data.updatedAt!;
    }
}