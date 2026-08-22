import {Request, Response, NextFunction} from "express";
import {validateBody} from "../../../common/validation/validate";
import {SystemRole} from "../../user/entity/enums";
import {CreateProductDTO, UpdateProductDTO} from "../dto/product.dto";
import {ProductService, productService} from "../service/product.service";

export class ProductController {
    constructor(private readonly productService: ProductService) {}

    findCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await this.productService.findCategories(Number(req.params.restaurantId));
            res.status(200).json({data: results});
        } catch (err) {
            next(err);
        }
    }

    findByBranch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await this.productService.findByBranch(Number(req.params.branchId));
            res.status(200).json({data: results});
        } catch (err) {
            next(err);
        }
    }

    findByRestaurant  = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await this.productService.findByRestaurant(Number(req.params.restaurantId), 
            Number(req.user?.userId), 
            req.user?.role! as SystemRole);
            res.status(200).json({data: results});
        } catch (err) {
            next(err);
        }
    }

    findById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await this.productService.findById(Number(req.params.id));
            res.status(200).json(product);
        } catch (err) {
            next(err);
        }
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateProductDTO, req.body);
            const product = await this.productService.create(
                Number(req.params.restaurantId),
                req.user?.userId!,
                req.user?.role! as SystemRole,
                data,
            );
            res.status(201).json({message: "Product created", product});
        } catch (err) {
            next(err);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateProductDTO, req.body);
            const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
            const result = await this.productService.update(
                Number(req.params.id),
                req.user?.userId!,
                req.user?.role! as SystemRole,
                data,
                branchId,
            );
            res.status(200).json({message: "Product updated", ...result});
        } catch (err) {
            next(err);
        }
    }
}

export const productController = new ProductController(productService);
