import Joi from "joi";
import  {schema}  from "../utils/schema";

export const registerSchema = Joi.object({
    userName : schema.userName,
    fullName : schema.fullName,
    email : schema.email,
    password : schema.password,
})

export const loginSchema = Joi.object({
    email : schema.email,
    password : schema.password
})