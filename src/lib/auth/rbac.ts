import { Request, Response, NextFunction } from "express";
import { branchAccessRestrictedError, hasnotThisPermissionError, invalidOrMissingError, notAuthenticatedError, restaurantAccessRestrictedError } from "./errors"
import { SystemRole } from "../../app/user/user.enums";
import { PermissionCacheService } from "../../app/rbac/service/permissions-cache.service";
import { container } from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";

export interface RBACOptions{
    resource: string,
    action: string,
    allowSystemAdmin?: boolean
}

export function rbac(options: RBACOptions) {
    return async(req: Request, res: Response, next: NextFunction) => {
        // req.user is there , if not we will bail
        try {
            if (!req.user) throw notAuthenticatedError
            const {resource, action, allowSystemAdmin = true} = options;

            // if he is a system admin -> bypass
            if (allowSystemAdmin && req.user.role == SystemRole.SYSTEM_ADMIN) return next();
            // if restaurant user
            // 1. fetch permissions
            // 2. check if the permissions has the action for this resource
            if (req.user.role == SystemRole.RESTAURANT_USER) {
                const permissionCacheService = container.resolve<PermissionCacheService>(TOKENS.PermissionCacheService);
                const permissions = await permissionCacheService.getPermissions(req.user.restaurantRole!);
                if (!permissionCacheService.hasPermission(permissions, resource, action)) {
                    return next(hasnotThisPermissionError);
                }
                // pass
                return next();
            }
            // if not restaurant ser -> throw err
            next(hasnotThisPermissionError);
        }
        catch (err) {
            next(err);
        }
    }
}

export function requireRestaurantMember(paramName: string = 'restaurantId'){
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurantId = parseInt(req.params[paramName] as string); // req.params.restaurantId
            if (!restaurantId || isNaN(restaurantId)) return next(invalidOrMissingError);

            if (req.user?.role == SystemRole.SYSTEM_ADMIN) return next();

            if (Number(req.user?.restaurantId) !== restaurantId) return next(restaurantAccessRestrictedError);
            
            next();
        } catch (err) {
            next(err);
        }
    }
}

export function requireBranchAccess(paramName:string ='branchId') {
    return async (req: Request, res: Response, next: NextFunction) => { 
        try{
            if (req.user?.role == SystemRole.SYSTEM_ADMIN || req.user?.restaurantRole === 'owner') return next();
            
            const branchId = parseInt(req.params[paramName] as string) || parseInt(req.query[paramName] as string);
            if (!branchId) return next();
            
            const userBranchIds = req.user?.branchIds || [];
            const hasAccess = userBranchIds.includes(branchId);
            
            if (!hasAccess) return next(branchAccessRestrictedError);
            
            next();
        } catch(err){
            next(err);
        }
    }
}
