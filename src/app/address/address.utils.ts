import { Type } from "./entity/enums";

export interface UpdateAddressData{
    label?: string;
    country?: string;
    city?: string;
    street?: string;
    building?: string;
    apartmentNumber?: string;
    type?: Type;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
}