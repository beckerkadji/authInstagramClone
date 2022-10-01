import { Body, Post, Route, Tags } from "tsoa";
import { My_Controller } from "./controller";

@Route('register')
@Tags('Register controller')

export class RegisterController extends My_Controller{

    @Post('')
    public async register(
        @Body() body: 
    )
}