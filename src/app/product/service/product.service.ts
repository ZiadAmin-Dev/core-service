import { notAuthorisedError } from "../../../common/auth/errors";
import { Restaurant } from "../../restaurant/entity/restaurant.entity";
import { findRestaurantById } from "../../restaurant/repository/restaurant.repo";
import { restaurantNotFoundError } from "../../restaurant/resraurant.errors";
import { SystemRole } from "../../user/entity/enums";
import { CreateProductDTO, UpdateProductDTO } from "../dto/product.dto";
import { productNotFoundError } from "../product.errors";
import { createCategory, findCategoriesByRestaurant, findCategoryByName } from "../repository/category.repo"
import { updateProductBranchDetails } from "../repository/product-branch-details.repo";
import { createProduct, findProductById, findProductsByBranch, findProductsByRestaurant, updateProduct } from "../repository/product.repo";
import { db } from "../../../common/knex/knex";
import { findBranchById } from "../../branch/repository/branch.repo";
import { branchNotFoundError } from "../../branch/branch.errors";



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
}
export const productService = new ProductService();