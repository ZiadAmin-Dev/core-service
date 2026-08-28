import {NextFunction, Response, Request} from "express";
import {validateBody} from "../../../common/validation/validate";
import {CreateMemberDTO} from "../dto/member.dto";
import {memberService} from "../service/member.service";

export class MemberController {
    createMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateMemberDTO,req.body);
            const result = await memberService.createMember(Number(req.params.restaurantId), data);
            res.status(200).send({ message: "Member added succesfuly", result });
        }
        catch (error) {
            next(error);
        }
    }
}

export const memberController = new MemberController();