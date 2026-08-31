import {Router} from "express";
import {authnetcation} from "../../lib/auth/guard";
import {requireRestaurantMember, rbac} from "../../lib/auth/rbac";
import {memberController} from "./controller/member.controller";

export const rbacRouter = Router();

// GET /roles/:role/permissions — public
rbacRouter.get('/roles/:role/permissions', memberController.getRolePermissions);

// POST /restaurants/:restaurantId/members — create/invite member
rbacRouter.post('/restaurants/:restaurantId/members', 
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'create'}),
    memberController.createMember
);

// GET /restaurants/:restaurantId/members — list members
rbacRouter.get('/restaurants/:restaurantId/members',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'read'}),
    memberController.listMembers
);


// PATCH /restaurants/:restaurantId/members/:memberId — update member
rbacRouter.patch('/restaurants/:restaurantId/members/:memberId',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    memberController.updateMember
);

// DELETE /restaurants/:restaurantId/members/:memberId — delete member
rbacRouter.delete('/restaurants/:restaurantId/members/:memberId',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'delete'}),
    memberController.deleteMember
);

// PUT /restaurants/:restaurantId/members/:memberId/branches — update branch assignments
rbacRouter.put('/restaurants/:restaurantId/members/:memberId/branches',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    memberController.updateMemberBranches
);
