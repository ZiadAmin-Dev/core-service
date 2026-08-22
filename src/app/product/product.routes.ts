import {Router} from "express";
import {authnetcation} from "../../common/auth/guard";
import {productController} from "./controller/product.controller";

export const productRouter = Router();

productRouter.get('/restaurants/:restaurantId/categories', productController.findCategories);
productRouter.get('/branches/:branchId/products', productController.findByBranch);

//TODO: TESTING
productRouter.get('/restaurants/:restaurantId/products', authnetcation, productController.findByRestaurant);
productRouter.get('/products/:id', productController.findById);
productRouter.post('/restaurants/:restaurantId/products', authnetcation, productController.create);
productRouter.patch('/products/:id', authnetcation, productController.update);
