import { Request, Response, NextFunction } from "express";
import { notAuthenticatedError } from "./errors"
import { SystemRole } from "../../app/user/user.enums";
import { permissionCacheService } from "../../app/rbac/service/permissions-cache.service";

export interface RBACOptions{
    resource: string,
    action: string,
    allowSystemAdmin?: boolean
    checkOwnerShip?: boolean
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
                const permissions = await permissionCacheService.getPermissions(req.user.restaurantRole!);
                if (!permissionCacheService.hasPermission(permissions, resource, action)) {
                    return res.status(403).json({error: "Permission denied",})
                }
                // pass
                return next();
            }
            // if not restaurant ser -> throw err
            return res.status(403).json({error: "Permission denied",})
        }
        catch (err) {
            next(err);
        }
    }
}

export function requireRestaurantMember(paramName: string = 'restaurantId'){
    return async (req: Request, res: Response, next: NextFunction) =>{
        const restaurantId = parseInt(req.params[paramName] as string); // req.params.restaurantId
        if (!restaurantId || isNaN(restaurantId)) return res.status(400).json({ message: "Invalid or missing restaurant ID parameter" });
        
        if (req.user?.role == SystemRole.SYSTEM_ADMIN) return next();

        if (Number(req.user?.restaurantId) !== restaurantId){
            return res.status(403).json({ error: "Permission denied: Access to this restaurant is restricted", });
        }
        return next();
    }
}

export async function requireBranchAccess(paramName:string ='branchId') {
    return async (req: Request, res: Response, next: NextFunction) => { 
        const branchId = parseInt(req.params[paramName] as string);
        if (!branchId || isNaN(branchId)) return res.status(400).json({ message: "Invalid or missing branch ID parameter" });

        if (req.user?.role == SystemRole.SYSTEM_ADMIN || req.user?.restaurantRole === 'owner') return next();
        
        const userBranchIds = req.user?.branchIds || [];
        const hasAccess = userBranchIds.includes(branchId);
        
        if (!hasAccess) return res.status(403).json({ error: "Permission denied: Access to this branch is restricted", })
        
        return next();
    }
}
