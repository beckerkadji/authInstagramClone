import { defaultEmail } from "./defaults/email.types"
import { defaultOtp } from "./defaults/otp.type"
import { defaultPassword } from "./defaults/password.type"

declare namespace UserType {
    export interface loginFields {
        email: defaultEmail,
        password : defaultPassword
    }

    export interface verifyOtp {
        email: defaultEmail,
        otp: defaultOtp
    }

    export interface resentOtp {
        email: defaultEmail,
    }
}
export default UserType

