import {Knex} from "knex";
import {db} from "../../../common/knex/knex";
import {ProductCategory} from "../entity/product-category.entity";

const CATEGORY_COLUMNS = ['id', 'restaurant_id', 'name', 'created_at', 'updated_at'];

function toEntity(row: any): ProductCategory {
    return new ProductCategory({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export async function findCategoryByName(restaurantId: number, name: string, conn: Knex = db): Promise<ProductCategory | undefined> {
    const row = await conn("product_categories")
        .select(CATEGORY_COLUMNS)
        .where("restaurant_id", restaurantId)
        .where("name", name)
        .first();
    return row ? toEntity(row) : undefined;
}

export async function findCategoriesByRestaurant(restaurantId: number): Promise<ProductCategory[]> {
    const rows = await db("product_categories")
        .select(CATEGORY_COLUMNS)
        .where("restaurant_id", restaurantId);
    return rows.map(toEntity);
}

//=====================================================================
//                          CREATE METHODS
//=====================================================================

export async function createCategory(restaurantId: number, name: string, conn: Knex = db): Promise<ProductCategory> {
    const [row] = await conn("product_categories").insert({
        restaurant_id: restaurantId,
        name: name,
        created_at: new Date(),
        updated_at: new Date()
    }).returning(CATEGORY_COLUMNS);

    return toEntity(row);
}
