import knex, { Knex } from "knex";
import {db} from "../../../common/knex/knex";
import {Product} from "../entity/product.entity";

const PRODUCT_COLUMNS = ['id', 'name', 'description', 'image_url', 'restaurant_id', 'category_id', 'created_at', 'updated_at', 'deleted_at'];

function toEntity(row: any): Product {
    return new Product({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        restaurantId: row.restaurant_id,
        categoryId: row.category_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    });
}

export async function findProductById(id: number): Promise<Product | undefined> {
    const row = await db("products")
        .select(PRODUCT_COLUMNS)
        .where("id", id)
        .whereNull("deleted_at")
        .first();
    return row ? toEntity(row) : undefined;
}

export async function findProductsByRestaurant(restaurantId: number): Promise<Product[]> {
    const rows = await db("products")
        .select(PRODUCT_COLUMNS)
        .where("restaurant_id", restaurantId)
        .whereNull("deleted_at");
    return rows.map(toEntity);
}

export async function findProductsByBranch(branchId: number) {
    const rows = await db("products as p")
    .join("product_branch_details as pbd", "p.id", "pbd.product_id")
    .leftJoin("product_categories as pc", "p.category_id", "pc.id")
    .where("pbd.branch_id", branchId)
    .whereNull("p.deleted_at")
    .select(
            "p.id",
            "p.name",
            "p.description",
            "p.image_url",
            "p.restaurant_id",
            "p.category_id",
            "pc.name as category_name",
            "pbd.price",
            "pbd.stock",
            "pbd.is_available",
        );
    return rows.map((row: any) => ({
        id: Number(row.id),
        name: row.name,
        description: row.description,
        imageURL: row.image_url,
        restaurantId: Number(row.restaurant_id),
        categoryId: row.category_id ? Number(row.category_id) : null,
        categoryName: row.category_name,
        price: row.price,
        stock: row.stock,
        isAvailable: Boolean(row.is_available),
    }));
}


//=====================================================================
//                          CREATE METHODS
//=====================================================================

export async function createProduct(data: Partial<Product>, conn:Knex = db): Promise<Product> {
    const [row] = await conn("products").insert({
        name: data.name,
        description: data.description,
        image_url: data.imageUrl,
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        created_at: data.createdAt ?? new Date(),
        updated_at: data.updatedAt ?? new Date()
    }).returning(PRODUCT_COLUMNS);
    return toEntity(row);
}


//=====================================================================
//                          UPDATE METHODS
//=====================================================================

export async function updateProduct(id: number, data: Record<string, any>, conn: Knex = db): Promise<Product> {
    const [row] = await conn("products").where("id", id).update({
        name: data.name,
        description: data.description,
        image_url: data.imageUrl,
        category_id: data.categoryId,
        updated_at: new Date(),
    }).returning(PRODUCT_COLUMNS);
    return toEntity(row);
}
