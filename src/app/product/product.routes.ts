import { Router } from "express";
import { authentication } from "../../lib/auth/guard";
import { ProductController } from "./controller/product.controller";
import { rbac, requireRestaurantMember, requireBranchAccess } from "../../lib/auth/rbac";
import {TOKENS} from "../../lib/di/tokens";
import {container} from "../../lib/di/container";

const productController = container.resolve<ProductController>(TOKENS.ProductController);

export const productRouter = Router();

productRouter.get('/restaurants/:restaurantId/categories', productController.findCategories);
productRouter.get('/branches/:branchId/products', productController.findByBranch);
productRouter.get('/products/:id', productController.findById);

productRouter.get('/restaurants/:restaurantId/products',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:'read'}),
    productController.findByRestaurant
);

productRouter.post('/restaurants/:restaurantId/products',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:'create'}),
    productController.create
);

productRouter.patch('/products/:id',
    authentication,
    requireBranchAccess('branchId'),
    rbac({resource:"core:product", action:'update'}),
    productController.update
);
