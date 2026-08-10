import { db } from "../../../common/knex/knex";
import { Address } from "../entity/address.entity";
import { UpdateAddressData } from "../address.utils";

const ADDRESS_COLUMNS = [
    "id",
    "user_id",
    "label",
    "country",
    "city",
    "street",
    "building",
    "apartment_number",
    "type",
    "lat",
    "lng",
    "is_default",
    "created_at",
    "updated_at",
];

function toEntity(row: any) {
    return new Address({
        id: row.id,
        userId: row.user_id,
        label: row.label,
        country: row.country,
        city: row.city,
        street: row.street,
        building: row.building,
        apartmentNumber: row.apartment_number,
        type: row.type,
        lat: row.lat,
        lng: row.lng,
        isDefault: row.is_default,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    });
}

function toDatabaseUpdate(data: UpdateAddressData) {
    return {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.building !== undefined && { building: data.building }),
        ...(data.apartmentNumber !== undefined && {
            apartment_number: data.apartmentNumber,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.isDefault !== undefined && {
            is_default: data.isDefault,
        }),
    };
}

//========================================================================================
//                                  FIND Address METHODS
//========================================================================================
export async function findAddressById(id: number): Promise<Address | undefined> {
    const row = await db("customer_addresses").select(ADDRESS_COLUMNS).where("id", id).first();
    return row ? toEntity(row) : undefined;
}

export async function findAddressesByUserId(userId: number): Promise<Address[]> {
    const rows = await db("customer_addresses").select(ADDRESS_COLUMNS).where("user_id", userId);
    return rows.map(toEntity);
}

export async function findAddressByIdAndUserId(addressId: number ,userId: number): Promise<Address | undefined> {
    const row = await db("customer_addresses").select(ADDRESS_COLUMNS).where({"id": addressId, "user_id": userId,}).first();
    return row ? toEntity(row) : undefined;
}

//========================================================================================
//                                  Create Address METHODS
//========================================================================================

export async function createAddress(address: Partial<Address>): Promise<Address> {

    const [row] = await db("customer_addresses")
        .insert({
            user_id: address.userId,
            label: address.label,
            country: address.country,
            city: address.city,
            street: address.street,
            building: address.building,
            apartment_number: address.apartmentNumber,
            type: address.type,
            lat: address.lat,
            lng: address.lng,
            is_default: address.isDefault,
            created_at: address.createdAt,
            updated_at: address.updatedAt,
        }).returning(ADDRESS_COLUMNS);

    return toEntity(row);
}










export async function updateAddress(addressId: number, userId: number, data: UpdateAddressData): Promise<void> {

    await db("customer_addresses").where({id: addressId, user_id: userId,}).update(toDatabaseUpdate(data))
}











export async function deleteAddress(addressId: number, userId: number): Promise<void> {
    await db("customer_addresses").where({ id: addressId, user_id: userId }).del();
}