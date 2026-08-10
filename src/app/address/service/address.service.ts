import { Address } from "../entity/address.entity";
import { findAddressesByUserId, createAddress, findAddressByIdAndUserId, updateAddress, deleteAddress } from "../repository/addresses.repo";
import { AddressDTO, UpdateAddressDTO } from "../dto/address.dto";
import { findUserExistsById } from "../../user/repository/users.repo";
import { userNotFoundError } from "../../auth/auth.errors";
import { addressNotFoundError } from "../address.errors";


export class AddressService{
    getAddressesByUserId = async (userId: number): Promise<Address[]> => {
        return findAddressesByUserId(userId);
    }
    
    addAddress = async (data: AddressDTO, userId:number) =>{

        const user = await findUserExistsById(userId);
        if(!user) throw userNotFoundError;

        const address = await createAddress({
        userId,
        label: data.label,
        country: data.country,
        city: data.city,
        street: data.street,
        building: data.building,
        apartmentNumber: data.apartmentNumber,
        type: data.type,
        lat: data.lat,
        lng: data.lng,
        isDefault: data.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return address;
    }

    updateAddress = async (data: UpdateAddressDTO, addressId: number, userId:number) =>{

        const user = await findUserExistsById(userId);
        if(!user) throw userNotFoundError;
        const address = await findAddressByIdAndUserId(addressId, userId);
        if(!address) throw addressNotFoundError
        await updateAddress(addressId, userId, data);
        return await findAddressByIdAndUserId(addressId, userId);
    }

    deleteAddress = async (addressId: number, userId: number) => {
        const user = await findUserExistsById(userId);
        if (!user) throw userNotFoundError;
        const address = await findAddressByIdAndUserId(addressId, userId);
        if (!address) throw addressNotFoundError;
        await deleteAddress(addressId, userId);
    }
}

export const addressService = new AddressService()