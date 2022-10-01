import { Body, Post, Route, Tags } from "tsoa";
import bcrypt from "bcryptjs"
import code from "../../src/config/code";
import { ResponseHandler } from "../../src/config/responseHandler";
import { UserModel } from "../models/user";
import RegisterType from "../types/registerType";
import { registerSchema } from "../validations/user.validation";
import { IResponse, My_Controller } from "./controller";
import { USER_ROLE } from "../models/role";
import LoginType from "../types/loginType";
import { OtpModel } from "../models/otp";

const response = new ResponseHandler()

@Route('register')
@Tags('Register controller')

export class RegisterController extends My_Controller{

    @Post('')
    public async register(
        @Body() body: RegisterType.registerFields
    ): Promise<IResponse> {
        try {
            const validate = this.validate(registerSchema, body)
            if(validate !== true)
                return response.liteResponse(code.VALIDATION_ERROR, "Validation Error !", validate)

            //Check if email already exist
            const verifyEmail = await UserModel.findFirst({where:{email : body.email}})
            if(verifyEmail)
                return response.liteResponse(code.FAILURE, "Email already exist, Try with another email")
            

            //generate otp for this connexion
            let otp = this.generateOTP()
            const createOtp = await OtpModel.create({
                data: {
                    otp: otp,
                    expiredIn: (Math.round(new Date().getTime()/ 1000)) + 300, // expired after 5 minutes
                    userEmail : body.email
                }
            })
            //send otp for validate this email
            let res = await this.sendMail(body.email, "OTP for email validation",'otp', createOtp.otp)
            if(res.status == 'error')
                return response.liteResponse(code.FAILURE, "Error occured, Try again !", res)

            //save user
            console.log("Create user...")
            const createUser = await UserModel.create({data: {
                    userName: body.userName,
                    fullName: body.fullName,
                    tel: body.tel,
                    email: body.email,
                    password: bcrypt.hashSync(body.password, 10),
                    roleId: USER_ROLE.USER
                }})
            console.log("Create user Success")
            return response.liteResponse(code.SUCCESS, "User registered with Success. Validate yours email to login", createUser)
        }catch (e){
            return response.catchHandler(e)
        }
    }

    @Post('validateEmail')
    public async verifyEmail(
        @Body() body: LoginType.verifyOtp
    ): Promise<IResponse>{
        try{
            const foundUser: any = await UserModel.findFirst({where: {email: body.email}})
            if(!foundUser)
            return response.liteResponse(code.NOT_FOUND, 'User not found, Invalid email')

            let foundOtp = await OtpModel.findFirst({
                where:{
                    otp: body.otp,
                    userEmail: body.email
                }
            })
            if(!foundOtp)
                return response.liteResponse(code.NOT_FOUND, "Incorrect otp, try again !")
    
            //Check if otp is expired
            if(foundOtp.expiredIn < Math.round(new Date().getTime() / 1000))
                return response.liteResponse(code.FAILURE, "This otp is expired. Resend otp !")
    
            //verify user
            let updateUser = await UserModel.update({
                where:{
                    email:body.email
                },data:{
                    emailVerified: true
                }
            })
    
            return response.liteResponse(code.SUCCESS, "User verified with success. Login", updateUser)
        }catch(e){
            return response.catchHandler(e)
        }
    }

    @Post('resentotp')
    public async resendotp(
        @Body() body : LoginType.resentOtp
    ): Promise<IResponse>{
        try{
            const foundUser: any = await UserModel.findFirst({where: {email: body.email}})
            if(!foundUser)
            return response.liteResponse(code.NOT_FOUND, 'User not found, Invalid email')
            let otp = this.generateOTP()
        
            //delete all previous send otp wich is'nt expired
            await OtpModel.deleteMany({
                where:{
                    userEmail: body.email,
                    expiredIn:{
                        gt: Math.round(new Date().getTime()/ 1000)
                    }
                }
            })
            const createOtp = await OtpModel.create({
                data: {
                    otp: otp,
                    expiredIn: (Math.round(new Date().getTime()/ 1000)) + 300, // expired after 5 minutes
                    userEmail : body.email
                }
            })
            //send mail
            let res = await this.sendMail(body.email, "OTP",'otp', createOtp.otp)
            if(res.status == 'error')
                return response.liteResponse(code.FAILURE, "Error occured, Try again !", res)

            return response.liteResponse(code.SUCCESS, "OTP code is resent")
        }catch(e){
            return response.catchHandler(e)
        }
        
    }
}