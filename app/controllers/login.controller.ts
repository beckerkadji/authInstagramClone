import {Body, Get, Post, Route, Tags,} from "tsoa";
import {  IResponse, My_Controller } from "./controller";
import LoginType from "../types/loginType";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {UserModel} from "../models/user";
import { ResponseHandler } from "../../src/config/responseHandler";
import code from "../../src/config/code";
import {TokenModel} from "../models/token";
import { OtpModel } from "../models/otp";
const response = new ResponseHandler()

@Tags("login Controller")
@Route("/login")

export class UserController extends My_Controller {

    @Post('')
    public async login(
        @Body() body : LoginType.loginFields
    ) : Promise<IResponse> {
        try {
            //found user
            const foundUser = await UserModel.findFirst({where: {email: body.email}})
            if(!foundUser)
                return response.liteResponse(code.NOT_FOUND, 'User not found, Invalid email or password !')
            
            //check if this user is verified
            if(foundUser.emailVerified == false)
                return response.liteResponse(code.FAILURE, "User not verify !")

                
            //Compare password
            const compare = bcrypt.compareSync(body.password, foundUser.password)
            if(!compare){
                return response.liteResponse(code.FAILURE, "Invalid password. Try again !")
            }
            else {
                //generate otp for this connexion
                let otp = this.generateOTP()
                const createOtp = await OtpModel.create({
                    data: {
                        otp: otp,
                        expiredIn: (Math.round(new Date().getTime()/ 1000)) + 300, // expired after 5 minutes
                        userEmail : foundUser.email
                    }
                })

                //send mail
                let res = await this.sendMail(foundUser.email, "OTP verification code ",'otp', createOtp.otp)
                if(res.status == 'error')
                    return response.liteResponse(code.FAILURE, "Error occured, Try again !", res)

                return response.liteResponse(code.SUCCESS, "Verify OTP", {email: createOtp.userEmail})
            }

        }
        catch (e){
            return response.catchHandler(e)
        }
    }

    @Post("verifyOtp")
    public async verifyOtp(
        @Body() body: LoginType.verifyOtp
    ) : Promise<IResponse> {
        try{
            const foundUser: any = await UserModel.findFirst({where: {email: body.email}})
            if(!foundUser)
            return response.liteResponse(code.NOT_FOUND, 'User not found, Invalid email !')

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

    
            // Create generate token
            const payload : any = {
                userId : foundUser.id,
                email : foundUser.email
            }
    
            const token = jwt.sign(payload, <string>process.env.SECRET_TOKEN, { expiresIn: '1d'})
            const decode: any = jwt.decode(token)
            //Create token for this user
            const createToken = await TokenModel.create({data : {
                userId: foundUser.id,
                    jwt: token,
                    expireIn : decode.exp
                }, select : {
                    jwt: true,
                }})
            const jwtToken : any = createToken.jwt
            return response.liteResponse(code.SUCCESS, "Success request login", {...foundUser, token: jwtToken})
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
            let res = await this.sendMail(body.email, "OTP verification code",'otp', createOtp.otp)
            if(res.status == 'error')
                return response.liteResponse(code.FAILURE, "Error occured, Try again !", res)

            return response.liteResponse(code.SUCCESS, "OTP code is resent")
        }catch(e){
            return response.catchHandler(e)
        }
        
    }
}