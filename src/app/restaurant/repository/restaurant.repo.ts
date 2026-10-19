import { Knex } from "knex";
import { db } from "../../../lib/knex/knex";
import { Restaurant } from "../entity/restaurant.entity"
import { RestaurantStatus } from "../entity/enums";
import { applyCursorPagination, applyFilters, FilterParams, PaginationParams } from "../../../lib/http/pagination/cursor-pagination";

const RESTAURANT_COLUMNS = [
    "id",
    "owner_id",
    "name",
    "logo_url",
    "status",
    "status_updated_at",
    "primary_country",
    "created_at",
    "updated_at",
]

function toEntity(row: any){
    return new Restaurant({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        logoURL: row.logo_url,
        status: row.status,
        statusUpdatedAt: row.status_updated_at,
        primaryCountry: row.primary_country,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    })
}


//========================================================================================
//                                  FIND Restaurant METHODS
//========================================================================================

export async function findAllRestaurants(paginationParams: PaginationParams, filtersParams: FilterParams[]): Promise<Restaurant[]> {
    let query = db("restaurants").select(RESTAURANT_COLUMNS);
    query = applyFilters(query, filtersParams);
    query = applyCursorPagination(query, paginationParams);
    const rows = await query;
    return rows.map(toEntity)
}

export async function findRestaurantById(id: number): Promise<Restaurant | undefined> {
    const row = await db("restaurants").select(RESTAURANT_COLUMNS).where("id", id).first();
    return row ? toEntity(row) : undefined;
}

export async function findRestaurantsByOwnerId(ownerId: number): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("owner_id", ownerId);
    return rows.map(toEntity)
}

export async function findRestaurantsByStatus(restaurantStatus: RestaurantStatus): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("status", restaurantStatus);
    return rows.map(toEntity)
}

//========================================================================================
//                                  Create Restaurant METHODS
//========================================================================================
export async function createRestaurant(data: Partial<Restaurant>, conn: Knex = db): Promise<Restaurant> {
    const [row] = await conn("restaurants")
        .insert({
        owner_id: data.ownerId,
        name: data.name,
        logo_url: data.logoURL,
        status: data.status,
        status_updated_at: data.statusUpdatedAt,
        primary_country: data.primaryCountry,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
    }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}

//========================================================================================
//                                  Update METHODS
//========================================================================================
export async function updateRestaurant(id: number, data: {name?: string, logoUrl?: string, primaryCountry?: string}): Promise<Restaurant> {
    const [row] = await db("restaurants")
        .where("id", id)
        .update({
        name: data.name,
        logo_url: data.logoUrl,
        primary_country: data.primaryCountry,
            updated_at: new Date(),
        }).returning(RESTAURANT_COLUMNS);
    return toEntity(row);
}

export async function updateRestaurantStatus(id: number, status: RestaurantStatus): Promise<Restaurant> {
    const now = new Date();
    const [row] = await db("restaurants")
        .where("id", id)
        .update({
            status: status,
            status_updated_at: now,
            updated_at: now
        }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}