import { notAuthorisedError } from "../../../lib/auth/errors";
import { findRestaurantById } from "../../restaurant/repository/restaurant.repo";
import { restaurantNotFoundError } from "../../restaurant/resraurant.errors";
import { SystemRole } from "../../user/user.enums";
import { CreateProductDTO, UpdateProductDTO } from "../dto/product.request.dto";
import { invalidReserveItemsError, outOfStockError, productNotFoundError } from "../product.errors";
import { createCategory, findCategoriesByRestaurant, findCategoryByName } from "../repository/category.repo"
import { updateProductBranchDetails } from "../repository/product-branch-details.repo";
import { createProduct, findProductById, findProductsByBranch, findProductsByRestaurant, updateProduct } from "../repository/product.repo";
import { db } from "../../../lib/knex/knex";
import { findBranchById } from "../../branch/repository/branch.repo";
import { branchNotFoundError } from "../../branch/branch.errors";
import { injectable } from "tsyringe";
import { BranchProductRow, OutOfStockItem, ReserveStockApplied, ReserveStockInput, ReserveStockResult } from "../types";
import { insertOutboxEvent } from "../../../lib/events/outbox.repo";
import { EVENT_TYPES } from "../../../lib/events/event-types";

@injectable()
export class ProductService{
    
    findCategories = async (restaurantId: number) => {
        return await findCategoriesByRestaurant(restaurantId);
    }

    findByBranch = async (branchId: number) => {
        return await findProductsByBranch(branchId);
    }

    findByRestaurant = async (restaurantId: number, userId: number, userRole: SystemRole) =>{
        const restaurant = await findRestaurantById(restaurantId);
        if(!restaurant) throw restaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) throw notAuthorisedError;
        return await findProductsByRestaurant(restaurantId);
    }

    findById  = async (id: number) =>{
        const product = await findProductById(id);
        if(!product) throw productNotFoundError;
        return product;
    }

    findByBranchAndIds = async (branchId: number, productIds: number[]): Promise<BranchProductRow[]> => {
        if (productIds.length === 0) return [];
        const rows = await db("product_branch_details as pbd")
            .join("products as p", "p.id", "pbd.product_id")
            .where("pbd.branch_id", branchId)
            .whereIn("pbd.product_id", productIds)
            .whereNull("p.deleted_at")
            .select(
                "pbd.product_id",
                "p.name",
                "p.image_url",
                "pbd.price",
                "pbd.stock",
                "pbd.is_available",
            );
        return rows.map((r: any) => ({
            productId: r.product_id,
            name: r.name,
            imageUrl: r.image_url,
            price: r.price,
            stock: r.stock,
            isAvailable: r.is_available,
        }));
    }

    create = async (restaurantId: number, userId: number, userRole: SystemRole, data: CreateProductDTO) => {
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) throw restaurantNotFoundError;
        
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) throw notAuthorisedError;

        return await db.transaction(async (trx) => {
            let categoryId: number | null = null;

            if (data.categoryName) {
                let category = await findCategoryByName(restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }

            const product = await createProduct({
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                restaurantId,
                categoryId,
            }, trx);

            return product;
        });
    }

    update = async (productId: number, userId: number, userRole: SystemRole, data: UpdateProductDTO, branchId?: number) => {
        const product = await findProductById(productId);
        if (!product) throw productNotFoundError;
        
        const restaurant = await findRestaurantById(product.restaurantId);
        if (!restaurant) throw restaurantNotFoundError;
        
        if (branchId) {
            const branch = await findBranchById(branchId);
            if (!branch || Number(branch.restaurantId) !== Number(product.restaurantId)) throw branchNotFoundError;
        
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) throw notAuthorisedError;
        
        return await db.transaction(async (trx) => {
            let categoryId: number | undefined = undefined;
        
            if (data.categoryName) {
                let category = await findCategoryByName(product.restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(product.restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }
        
            const updatedProduct = await updateProduct(productId, {
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                categoryId,
            }, trx);
        
            let productBranchDetails;
            if (branchId && (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)) {
                productBranchDetails = await updateProductBranchDetails(branchId, productId, {
                    price: data.price,
                    stock: data.stock,
                    isAvailable: data.isAvailable,
                }, trx);
            }
        
            return { product: updatedProduct, branchDetails: productBranchDetails };
        });
        }
    }

    /**
     * Atomically decrements branch stock for each item. Locks the rows FOR UPDATE
     * and emits product.stock.changed per decrement so order-service invalidates
     * its cache.
     */
    reserveStock = async (branchId: number, items: ReserveStockInput[]): Promise<ReserveStockResult> => {
        const sanitized = items
            .map((it) => ({productId: Number(it.productId), quantity: Number(it.quantity)}))
            .filter((it) => Number.isInteger(it.productId) && Number.isInteger(it.quantity) && it.quantity > 0);

        if (sanitized.length !== items.length) {
            throw invalidReserveItemsError;
        }

        const productIds = sanitized.map((i) => i.productId);

        const trx = await db.transaction();
        try {
            const rows = await trx("product_branch_details")
                .where("branch_id", branchId)
                .whereIn("product_id", productIds)
                .select("product_id", "stock", "is_available")
                .forUpdate();

            const byProduct = new Map<number, {stock: number; isAvailable: boolean}>();
            for (const r of rows) byProduct.set(Number(r.product_id), {stock: r.stock, isAvailable: r.is_available});

            const offending: OutOfStockItem[] = [];
            for (const it of sanitized) {
                const current = byProduct.get(it.productId);
                if (!current || !current.isAvailable) {
                    offending.push({productId: it.productId, requested: it.quantity, available: 0});
                    continue;
                }
                if (current.stock < it.quantity) {
                    offending.push({productId: it.productId, requested: it.quantity, available: current.stock});
                }
            }

            if (offending.length > 0) {
                throw outOfStockError(offending);
            }

            const applied: ReserveStockApplied[] = [];
            for (const it of sanitized) {
                const newStock = byProduct.get(it.productId)!.stock - it.quantity;
                await trx("product_branch_details")
                    .where("branch_id", branchId)
                    .where("product_id", it.productId)
                    .update({stock: newStock});
                applied.push({productId: it.productId, newStock});
            }

            for (const a of applied) {
                await insertOutboxEvent(trx, {
                    aggregateType: "product_branch_details",
                    aggregateId: `${branchId}:${a.productId}`,
                    eventType: EVENT_TYPES.PRODUCT_STOCK_CHANGED,
                    payload: {branchId, productId: a.productId, newStock: a.newStock},
                });
            }

            await trx.commit();
            return {ok: true, applied};
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    }
}