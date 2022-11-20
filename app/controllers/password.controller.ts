import { Body, Post, Route, Tags } from "tsoa";
import bcrypt from "bcryptjs"
import code from "../../src/config/code";
import { ResponseHandler } from "../../src/config/responseHandler";
import { UserModel } from "../models/user";
import { IResponse, My_Controller } from "./controller";
import LoginType from "../types/loginType";
import { PasswordModel } from "../models/password";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const response = new ResponseHandler()

@Route('password')
@Tags('Password Controller')

export class PasswordController extends My_Controller{

    @Post('/forgotpassword')
    public async forgotPassword(
        @Body() body: LoginType.resentOtp
    ): Promise<IResponse> {
        //  try {
            //Check user account
            const foundUser = await UserModel.findFirst({where:{email : body.email}})
            if(!foundUser)
                return response.liteResponse(code.NOT_FOUND, "User not found, try with another email!")
            
            //generate new Password for this user
            let newPassword = this.generateString()
            const createPassword  = await PasswordModel.create({
                data: {
                    userEmail : body.email,
                    newPassword
                }
            })
            //send new password email
            let res = await this.sendMail(body.email, "New password", "forgot", createPassword.newPassword)
            if(res.status == 'error')
                return response.liteResponse(code.FAILURE, "Error occured, Try again !", res)

            //update user password
            const updatePassword = await UserModel.update({
                where:{
                    email: body.email
                },
                data : {
                    password:bcrypt.hashSync(newPassword, 10)
                }
            })
            return response.liteResponse(code.SUCCESS, "User Password is updated with Success !", updatePassword)
        // }catch (e){
        //     return response.catchHandler(e)
        // }
    }
}