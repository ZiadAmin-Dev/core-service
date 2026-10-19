import {Request, Response, NextFunction} from "express";
import {validateBody} from "../../../lib/validation/validate";
import {SystemRole} from "../../user/user.enums";
import {CreateProductDTO, UpdateProductDTO} from "../dto/product.request.dto";
import {ProductService} from "../service/product.service";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { sendSuccess } from "../../../lib/http/response";
import { invalidReserveItemsError, missingProductIdsQueryError } from "../product.errors";

@injectable()
export class ProductController {
    constructor(@inject(TOKENS.ProductService) private readonly productService: ProductService) {}

    findCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //TODO: study that you must do ValidateParams and ValidateQueryParams Middlewares to validate params and query params, but for now we will do it here
            // if(!req.params.restaurantId || isNaN(Number(req.params.restaurantId))) {
            //     return res.status(400).json({message: "Invalid restaurantId parameter"});
            // }
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

    findByBranchAndIds = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = Number(req.params.id);
            const raw = typeof req.query.ids === "string" ? req.query.ids : "";
            const ids = raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
            if (ids.length === 0) throw missingProductIdsQueryError;
            const products = await this.productService.findByBranchAndIds(branchId, ids);
            sendSuccess(res, products);
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

    reserveStock = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const branchId = Number(req.params.id);
            const items = req.body?.items;
            if (!Array.isArray(items) || items.length === 0) {
                throw invalidReserveItemsError;
            }
            const result = await this.productService.reserveStock(branchId, items);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    }
}