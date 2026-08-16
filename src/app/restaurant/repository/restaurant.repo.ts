import { Knex } from "knex";
import { db } from "../../../common/knex/knex";
import { Restaurant } from "../entity/restaurant.entity"

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

export async function findAllRestaurants(): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS);
    return rows.map(toEntity)
}   

export async function findActiveRestaurants(): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("status", "active");
    return rows.map(toEntity)
}

export async function findDisabledRestaurants(): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("status", "disabled");
    return rows.map(toEntity)
}

export async function findSuspendedRestaurants(): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("status", "suspended");
    return rows.map(toEntity)
}

export async function findPendingRestaurants(): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("status", "pending");
    return rows.map(toEntity)
}

export async function findRestaurantById(id: number): Promise<Restaurant> {
    const row = await db("restaurants").select(RESTAURANT_COLUMNS).where("id", id).first();
    return toEntity(row);
}

export async function findRestaurantsByOwnerId(ownerId: number): Promise<Restaurant[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS).where("owner_id", ownerId);
    return rows.map(toEntity)
}

//========================================================================================
//                                  Create Restaurant METHODS
//========================================================================================
export async function createRestaurant(restaurant: Partial<Restaurant>, conn: Knex = db) {
    const [row] = await conn("restaurants").insert({owner_id: restaurant.ownerId,
        name: restaurant.name,
        logo_url: restaurant.logoURL,
        status: restaurant.status,
        status_updated_at: restaurant.statusUpdatedAt,
        primary_country: restaurant.primaryCountry,
        created_at: restaurant.createdAt,
        updated_at: restaurant.updatedAt,
    }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}

//========================================================================================
//                                  Update Address METHODS
//========================================================================================
