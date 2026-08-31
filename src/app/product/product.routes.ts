import { Router } from "express";
import { authnetcation } from "../../lib/auth/guard";
import { productController } from "./controller/product.controller";
import { rbac, requireRestaurantMember, requireBranchAccess } from "../../lib/auth/rbac";


export const productRouter = Router();

productRouter.get('/restaurants/:restaurantId/categories', productController.findCategories);
productRouter.get('/branches/:branchId/products', productController.findByBranch);
productRouter.get('/products/:id', productController.findById);

productRouter.get('/restaurants/:restaurantId/products',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:'read'}),
    productController.findByRestaurant
);

productRouter.post('/restaurants/:restaurantId/products',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:'create'}),
    productController.create
);
productRouter.patch('/products/:id',
    authnetcation,
    requireBranchAccess('branchId'),
    rbac({resource:"core:product", action:'update'}),
    productController.update
);
