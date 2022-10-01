import { defaultEmail } from "./defaults/email.types";
import { defaultFullName } from "./defaults/fullName.type";
import { defaultPassword } from "./defaults/password.type";
import { defaultTel } from "./defaults/tel.type";
import { defaultUserName } from "./defaults/userName.type";

declare namespace RegisterType{
    export interface registerFields {
        userName: defaultUserName,
        fullName: defaultFullName,
        email: defaultEmail,
        tel?: defaultTel,
        password: defaultPassword
    }
}

export default RegisterType