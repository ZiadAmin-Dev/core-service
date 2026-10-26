import { Knex } from "knex";
import { RegisterRestaurantDTO } from "../../auth/dto/auth.request.dto";
import { RestaurantStatus } from "../entity/enums";
import { Restaurant } from "../entity/restaurant.entity";
import { createRestaurant, findRestaurantsByStatus, findAllRestaurants, findRestaurantById, updateRestaurant, updateRestaurantStatus } from "../repository/restaurant.repo";
import { restaurantNotFoundError } from "../resraurant.errors";
import { CreateRestaurantDTO, UpdateRestaurantDTO } from "../dto/restaurant.request.dto";
import { SystemRole } from "../../user/user.enums";
import { notAuthorisedError } from "../../../lib/auth/errors";
import { db } from "../../../lib/knex/knex";
import { insertOutboxEvent } from "../../../lib/events/outbox.repo";
import { EVENT_TYPES } from "../../../lib/events/event-types";
import { UserService } from "../../user/service/user.service";
import { MemberService } from "../../rbac/service/member.service";
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { buildPaginationResult, FilterParams, PaginationParams } from "../../../lib/http/pagination/cursor-pagination";

@injectable()
export class RestaurantService {
    constructor(
        @inject(TOKENS.UserService) private readonly userService: UserService,
        @inject(TOKENS.MemberService) private readonly memberService: MemberService,
    ) { }

    createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw notAuthorisedError
        }

        const now = new Date();
        const trx = await db.transaction();

        try {
            const user = await this.userService.create({
                email: data.owner.email,
                phone: data.owner.phone,
                name: data.owner.name,
                password: data.owner.password,
                systemRole: SystemRole.RESTAURANT_USER,
            }, trx);

            const restaurant = await createRestaurant(new Restaurant({
                ownerId: user.id,
                name: data.name,
                logoURL: data.logoUrl ?? "",
                primaryCountry: data.primaryCountry,
                status: RestaurantStatus.ACTIVE,
                createdAt: now,
                updatedAt: now,
                statusUpdatedAt: now,
            }), trx);

            await this.memberService.createOwnerMember(restaurant.id, user.id, trx);

            await trx.commit();

            return {
                restaurant,
                owner: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    systemRole: user.systemRole,
                },
            };
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    findById = async (id: number): Promise<Restaurant> => {
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;
        return restaurant;
    }

    findAll = async (paginationParams: PaginationParams, filtersParams: FilterParams[]) => {
        const result = await findAllRestaurants(paginationParams, filtersParams);
        return buildPaginationResult(result, paginationParams.limit, paginationParams.sortBy);
    }

    findActive = () => findRestaurantsByStatus(RestaurantStatus.ACTIVE);

    findDisabled = () => findRestaurantsByStatus(RestaurantStatus.DISABLED);

    findSuspended = () => findRestaurantsByStatus(RestaurantStatus.SUSPENDED);

    findPending = () => findRestaurantsByStatus(RestaurantStatus.PENDING);

    create = async (userId: number, data: RegisterRestaurantDTO, trx: Knex)=> {
        const now = new Date();
        const restaurant = new Restaurant({
            ownerId: userId,
            name: data.name,
            logoURL: data.logoURL,
            primaryCountry: data.primaryCountry,
            status: RestaurantStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            statusUpdatedAt: now
        })
        const result = await createRestaurant(restaurant, trx);

        return result;
    }

    update = async( id:number, data: UpdateRestaurantDTO) =>{
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;
        const updated = await updateRestaurant(id, data)
        return {
            restaurant : updated
        }
    }

    updateStatus = async (id: number, userRole: string, status: RestaurantStatus) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) throw notAuthorisedError;
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;

        const trx = await db.transaction();
        try {
            const updated = await updateRestaurantStatus(id, status, trx);
            if (status === RestaurantStatus.SUSPENDED) {
                await insertOutboxEvent(trx, {
                    aggregateType: "restaurants",
                    aggregateId: id,
                    eventType: EVENT_TYPES.RESTAURANT_SUSPENDED,
                    payload: {restaurantId: id},
                });
            }
            await trx.commit();
            return updated;
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    };
}