import { Router } from "express";
import { authentication } from "../../lib/auth/guard";
import { requireRestaurantMember, rbac } from "../../lib/auth/rbac";
import { container } from "../../lib/di/container";
import { MemberController } from "./controller/member.controller";
import { TOKENS } from "../../lib/di/tokens";
import { requireInternalApiKey } from "../../lib/auth/api-key";

const memberController = container.resolve<MemberController>(TOKENS.MemberController);

export const rbacRouter = Router();

// GET /roles/:role/permissions — public
rbacRouter.get('/roles/:role/permissions', memberController.getRolePermissions);

// Internal (service-to-service)
rbacRouter.get('/internal/rbac/permissions', requireInternalApiKey, memberController.getPermissionsByRole);

// POST /restaurants/:restaurantId/members — create/invite member
rbacRouter.post('/restaurants/:restaurantId/members', 
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'create'}),
    memberController.createMember
);

// GET /restaurants/:restaurantId/members — list members
rbacRouter.get('/restaurants/:restaurantId/members',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'read'}),
    memberController.listMembers
);


// PATCH /restaurants/:restaurantId/members/:memberId — update member
rbacRouter.patch('/restaurants/:restaurantId/members/:memberId',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    memberController.updateMember
);

// DELETE /restaurants/:restaurantId/members/:memberId — delete member
rbacRouter.delete('/restaurants/:restaurantId/members/:memberId',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'delete'}),
    memberController.deleteMember
);

// PUT /restaurants/:restaurantId/members/:memberId/branches — update branch assignments
rbacRouter.put('/restaurants/:restaurantId/members/:memberId/branches',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    memberController.updateMemberBranches
);
