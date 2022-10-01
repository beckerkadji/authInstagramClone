import Joi, { optional } from "joi";

export const schema = {
    email : Joi.string().email().required(),
    password : Joi.string()
        .required()
        .min(8)
        .pattern(new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/)),
    firstName : Joi.string().min(2).required(),
    userName : Joi.string().min(2).required(),
    fullName: Joi.string().min(2).required(),
    tel: Joi.string().min(9).max(14).pattern(/^[0-9]+$/).optional(),
    lastName : Joi.string().min(2).optional(),
    phone : Joi.string().required().min(9),
    id : Joi.number().required(),
    age : Joi.number().min(1).max(100),
    title : Joi.string().required(),
    description : Joi.string().required(),
    image : Joi.string().required(),
}
    
