import { Get, Security, Tags, Request, Route } from "tsoa";
import code from "../../src/config/code";
import { ResponseHandler } from "../../src/config/responseHandler";
import { TokenModel } from "../models/token";
import { IResponse, My_Controller } from "./controller";
const response = new ResponseHandler()

@Security("Jwt")
@Tags("Log out controller")
@Route("/logout")
export class LogoutController extends My_Controller{

    @Get('')
    @Security("Jwt")
    public async logout(
        @Request() req : any
    ): Promise<IResponse> {
        try {
            const token = await TokenModel.findFirst({where: {jwt : req.headers['authorization']}})
            if(!token)
                return response.liteResponse(code.FAILURE, "Token not found",null)

            let expirate  = Math.round((new Date().getTime() / 1000) / 2)
            await TokenModel.update({where : {id: token.id}, data: {
                    expireIn: expirate,
                }})
            return response.liteResponse(code.SUCCESS, "Logout with success !", null)
        }catch (e){
            return response.catchHandler(e)
        }
    }
}