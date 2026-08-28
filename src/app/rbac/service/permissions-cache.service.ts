import { getPermissionsByRoleName } from "../repository/permissions.repo";
import { InMemoryCacheService } from "../../../common/cache/cache.service";


class PermissionCacheService{

    private cacheService = new InMemoryCacheService(1)

    async getPermissions(roleName: string): Promise<string[]> {
        const cacheKey = `role_permissions:${roleName}`;

        return this.cacheService.getOrFetch(cacheKey, async () => {
            return await getPermissionsByRoleName(roleName);
        });
    }

    hasPermission(userPermissions: string[], resource: string, action: string): boolean {
        return userPermissions.includes(`${resource}:${action}`);
    }

    invalidateRolePermissions(roleName: string): void {
        const cacheKey = `role_permissions:${roleName}`;
        this.cacheService.invalidate(cacheKey);
    }

    clearCache(roleName?: string) {
        if (roleName) this.cacheService.invalidate(roleName);
        else this.cacheService.clearAll();
    }
}

export const permissionCacheService = new PermissionCacheService();