import { CustomerAddress } from "../entity/customer-address.entity";
import { findAddressesByUserId, createAddress, findAddressByIdAndUserId, updateAddress, deleteAddress, clearDefaultByUserId, findAddressById } from "../repository/customer-address.repo";
import { createAddressDTO, UpdateAddressDTO } from "../dto/customer-address.dto";
import { addressNotFoundError } from "../customer-address.errors";

function toResponse(address: any) {
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

export class CustomerAddressService{
    getByUserId = async (userId: number): Promise<CustomerAddress[]> => {
        return findAddressesByUserId(userId);
    }
    
    create = async (data: createAddressDTO, userId: number) => {
        if(data.isDefault) await clearDefaultByUserId(userId);
        const address = await createAddress(new CustomerAddress({ 
            userId, 
            ...data, 
            createdAt: new Date(), 
            updatedAt: new Date() 
        }));
        return toResponse(address);
    }

    update = async (data: UpdateAddressDTO, addressId: number, userId:number) => {
        const address = await findAddressByIdAndUserId(addressId, userId);
        if (!address) throw addressNotFoundError;
        if (data.isDefault) await clearDefaultByUserId(userId);
        const updated = await updateAddress(addressId, data);
        return toResponse(updated);
    }

    remove = async (addressId: number, userId: number) => {
        const address = await findAddressByIdAndUserId(addressId, userId);
        if (!address) throw addressNotFoundError;
        await deleteAddress(addressId, userId);
    }
}

export const customerAddressService = new CustomerAddressService()