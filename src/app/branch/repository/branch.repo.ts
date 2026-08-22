import { Knex } from "knex";
import { db } from "../../../common/knex/knex";
import { Branch } from "../entity/branch.entity";

const BRANCH_COLUMNS = [
    "id",
    "restaurant_id",
    "country_code",
    "address_text",
    "label",
    "lat",
    "lng",
    "is_active",
    "opens_at",
    "closes_at",
    "accept_orders",
    "created_at",
    "updated_at",
    "delivery_radius",
    "currency",
    "commission",
];

export function toEntity(row: any): Branch {
    return new Branch({
        id: row.id,
        restaurantId: row.restaurant_id,
        countryCode: row.country_code,
        addressText: row.address_text,
        label: row.label,
        lat: Number(row.lat),
        lng: Number(row.lng),
        isActive: row.is_active,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
        acceptOrders: row.accept_orders,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deliveryRadius: row.delivery_radius,
        currency: row.currency,
        commission: row.commission,
    });
}


//========================================================================================
//                                  FIND METHODS
//========================================================================================

export async function findBranchById(id: number) :Promise<Branch | undefined> {
    const row = await db("restaurant_branches").select(BRANCH_COLUMNS).where("id", id).first();;
    return row ? toEntity(row) : undefined;
}


export async function findNearbyBranches(lat: number, lng:number) :Promise<Branch[]> {
    const result = await db.raw(`
        SELECT 
        b.id, 
        b.restaurant_id, 
        b.address_text, 
        b.label, 
        b.lat, 
        b.lng, 
        b.is_active, 
        b.accept_orders, 
        b.currency,
        r.name,
        r.logo_url
        FROM restaurant_branches b JOIN restaurants r ON b.restaurant_id = r.id
        where b.is_active = true AND r.status = 'active'
        AND ST_DWithin(b.location, ST_MakePoint(?, ?)::geography, b.delivery_radius * 1000)
        `,[lng, lat])

        return result.rows;
}

export async function findBranchesByRestaurantId(restaurantId: number) :Promise<Branch[]> {
    const rows = await db("restaurant_branches").select(BRANCH_COLUMNS).where("restaurant_id", restaurantId);
    return rows.map(toEntity);
}

export async function findActiveBranchesByRestaurantId(restaurantId: number): Promise<Branch[]> {
    const rows = await db("restaurant_branches").select(BRANCH_COLUMNS).where({ restaurant_id: restaurantId, is_active: true });
    return rows.map(toEntity);
}

//========================================================================================
//                                  CREATE METHODS
//========================================================================================
export async function createBranch(data: Partial<Branch>, conn: Knex = db): Promise<Branch> {
    const [row] = await conn("restaurant_branches").insert({
        restaurant_id: data.restaurantId,
        country_code: data.countryCode,
        address_text: data.addressText,
        label: data.label,
        lat: data.lat,
        lng: data.lng,
        is_active: data.isActive,
        opens_at: data.opensAt,
        closes_at: data.closesAt,
        accept_orders: data.acceptOrders,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        delivery_radius: data.deliveryRadius,
        currency: data.currency,
        commission: data.commission,
    }).returning(BRANCH_COLUMNS);

    return toEntity(row);
}


//========================================================================================
//                                  Update METHODS
//========================================================================================

export async function updateBranch(id: number, data: Partial<{label: string, addressText: string, lat: number, lng: number, opensAt: string, closesAt: string, deliveryRadius: number, currency: string, acceptOrders: boolean}>): Promise<Branch> {
    const [row] = await db("restaurant_branches").where("id", id).update({
        ...(data.label !== undefined && {label: data.label}),
        ...(data.addressText !== undefined && {address_text: data.addressText}),
        ...(data.lat !== undefined && {lat: data.lat}),
        ...(data.lng !== undefined && {lng: data.lng}),
        ...(data.opensAt !== undefined && {opens_at: data.opensAt}),
        ...(data.closesAt !== undefined && {closes_at: data.closesAt}),
        ...(data.deliveryRadius !== undefined && {delivery_radius: data.deliveryRadius}),
        ...(data.currency !== undefined && {currency: data.currency}),
        ...(data.acceptOrders !== undefined && {accept_orders: data.acceptOrders}),
        updated_at: new Date(),
    }).returning(BRANCH_COLUMNS);

    return toEntity(row);
}

export async function updateBranchStatus(id: number, data: Partial<{isActive: boolean, commission: number}>): Promise<Branch> {
    const [row] = await db("restaurant_branches").where("id", id).update({
        ...(data.isActive !== undefined && {is_active: data.isActive}),
        ...(data.commission !== undefined && {commission: data.commission}),
        updated_at: new Date(),
    }).returning(BRANCH_COLUMNS);

    return toEntity(row);
}
