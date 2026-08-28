import {Router} from "express";
import {authnetcation} from "../../common/auth/guard";
import {requireRestaurantMember, rbac} from "../../common/auth/rbac";
import {memberController} from "./controller/member.controller";

export const rbacRouter = Router();

rbacRouter.post('/restaurants/:restaurantId/members', 
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'create'}),
    memberController.createMember
);