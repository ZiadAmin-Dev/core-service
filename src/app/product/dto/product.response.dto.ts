import { Product } from "../entity/product.entity";
import { ProductCategory } from "../entity/product-category.entity";
import { ProductBranchDetails } from "../entity/product-branch-details.entity";
import { BranchProductRow, ReserveStockApplied } from "../types";

// Response DTOs — shapes returned by ProductService via ProductController
// (see DOCS/product.md).

export class ProductResponseDTO {
    id!: number;
    name!: string;
    description?: string;
    imageUrl?: string;
    restaurantId!: number;
    categoryId?: number | null;
    createdAt!: Date;
    updatedAt!: Date;

    static from(product: Product): ProductResponseDTO {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            restaurantId: product.restaurantId,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}

export class ProductCategoryResponseDTO {
    id!: number;
    restaurantId!: number;
    name!: string;
    createdAt!: Date;
    updatedAt!: Date;

    static from(category: ProductCategory): ProductCategoryResponseDTO {
        return {
            id: category.id,
            restaurantId: category.restaurantId,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}

export class BranchProductResponseDTO {
    id!: number;
    name!: string;
    description!: string;
    imageURL!: string;
    restaurantId!: number;
    categoryId!: number | null;
    categoryName!: string;
    price!: number;
    stock!: number;
    isAvailable!: boolean;

    static from(row: BranchProductResponseDTO): BranchProductResponseDTO {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            imageURL: row.imageURL,
            restaurantId: row.restaurantId,
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            price: row.price,
            stock: row.stock,
            isAvailable: row.isAvailable,
        };
    }
}

export class BranchProductRowResponseDTO {
    productId!: number;
    name!: string;
    imageUrl!: string | null;
    price!: number;
    stock!: number;
    isAvailable!: boolean;

    static from(row: BranchProductRow): BranchProductRowResponseDTO {
        return {
            productId: row.productId,
            name: row.name,
            imageUrl: row.imageUrl,
            price: row.price,
            stock: row.stock,
            isAvailable: row.isAvailable,
        };
    }
}

export class ProductBranchDetailsResponseDTO {
    id!: number;
    branchId!: number;
    productId!: number;
    price!: number;
    stock!: number;
    isAvailable!: boolean;

    static from(details: ProductBranchDetails): ProductBranchDetailsResponseDTO {
        return {
            id: details.id,
            branchId: details.branchId,
            productId: details.productId,
            price: details.price,
            stock: details.stock,
            isAvailable: details.isAvailable,
        };
    }
}

export class ReserveStockAppliedResponseDTO {
    productId!: number;
    newStock!: number;

    static from(applied: ReserveStockApplied): ReserveStockAppliedResponseDTO {
        return {
            productId: applied.productId,
            newStock: applied.newStock,
        };
    }
}

export class ReserveStockResponseDTO {
    ok!: true;
    applied!: ReserveStockAppliedResponseDTO[];

    static from(data: { ok: true; applied: ReserveStockApplied[] }): ReserveStockResponseDTO {
        return {
            ok: true,
            applied: data.applied.map(ReserveStockAppliedResponseDTO.from),
        };
    }
}
