import dotenv from "dotenv";
import { Controller } from "tsoa";
import cloudinary from "cloudinary";
import streamifier from "streamifier"
import nodemailer from "nodemailer"
import Email from "email-templates"
import path from "path"
import AWS from "aws-sdk"

const root = path.join(__dirname, '../../src/', 'emails')
dotenv.config();

cloudinary.v2.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUNDINARY_API_SECRET
})

//nodemailer Configuration for mailtrap

// const transport = nodemailer.createTransport({
//     port: 2525,
//     host: "smtp.mailtrap.io",
//     auth: {
//       user: process.env.NODEMAILER_USER,
//       pass: process.env.NODEMAILER_PASSWORD
//     }
//   });

//nodemailer Configuration for aws-sdk

AWS.config.update({
    accessKeyId: process.env.AWSACCESSKEYID,
    secretAccessKey: process.env.AWSSECRETKEY,
    region: process.env.REGION
})
const transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
});


//nodemailer Configuration for aws SMTP

// const transport = nodemailer.createTransport({
//     port: 465,
//     host:process.env.SMTPHOST,
//     secure:true,
//     auth: {
//         user: process.env.SMTPUSERNAME,
//         pass: process.env.SMTPPASSWORD
//     },
//     debug: true
// })


export interface IResponse {
    code : number,

    message ?: string,

    data?: any
}

export class My_Controller extends Controller {


    public generateOTP() : number{
       const otpTable = ['0','1','2','3','4','5','6','7','8','9']
       const random = [];
       for(let i = 0; i<6; i++){
        random.push(Math.floor(Math.random()* otpTable.length))
       }
       const otp = random.join('')
       return parseInt(otp)
    }

    public generateString() : string{
        const otpTable = ['a','X','2','Z','897','5Hg','0','@','b','9']
        for(let i = 0; i<10; i++){
            let j= Math.floor(Math.random()* otpTable.length)
            let temp = otpTable[i]
            otpTable[i] = otpTable[j]
            otpTable[j] = temp
        }
        const value = otpTable.join('')
        return value
     }

    public validate (schema: any, fields:any) : boolean | object {
        
        const validation  = schema.validate(fields,  { abortEarly: false });
        let errors : any = {};
        if (validation.error){
            for (const field of validation.error.details){
                errors[field.context.key] = field.message
            }
            return errors;
        }else {
            return true
        }
        
    }

    /**
     * 
     * @param file 
     * @returns Array of url for multiple upload file or url for single file upload
     */
    public async uploadFile (file : Express.Multer.File) : Promise<any> {

        if (Array.isArray(file)){
            const urls : any = [];
            for (const item of file){
                const newPath = await this.cloudinaryImageUploadMethod(item)
                console.log("newPath", newPath)
                urls.push(newPath)
            }
            
            return urls
        }else {
           const url = await this.cloudinaryImageUploadMethod(file)
           return url;
        }

    }  

    public async sendMail(to: string | string[], subject: string, template: string, option?: number | string | string[] | number[]) : Promise<any>{
        let response : any = ''
        const email =  new Email({
            views: {root},
            message: {
                from: 'kadjibecker@gmail.com'
            },
            send: true,
            // juiceResources: {
            //     webResources:{
            //         relativeTo: root
            //     }
            // },
            transport
        })
         await email.send({
            template : template,
            message:{
                to
            },
            locals:{
                otp: option,
                newpassword: option,
                subject
            }
        }).then((res) =>{
            response = res
        }).catch((error)=>{
            response = {
                status: 'error',
                res : error
            }
        })

        return response
    }

    private async cloudinaryImageUploadMethod(file : any) : Promise<any> {

        return new Promise((resolve, rejects) => {

            //Check extension for upload file
            // if(file.mimetype !== ('image/jpg' || 'image/jpeg' || 'image/png')) {
            //     rejects('You must upload jpg, jpeg or png file !');
            // }

            const uploadStream = cloudinary.v2.uploader.upload_stream({
                folder: "foo",
                transformation: [
                    {overlay: "white_iev0tr", width: 550, height: 90, flags: "relative", opacity: 30, gravity: "south_east", x: 5, y: 15},
                    {overlay: "semi_igre3f", width: 500, height:70, gravity: "south_east", x: 20, y: 20, crop: "scale"},
                ]
            },
            (error, result) => {
                if(error){
                    console.log();
                    console.log("** File Upload (Promise)");
                    console.warn(error);
                    rejects(error)
                } else {
                    console.log();
                    console.log("** File Upload (Promise)");
                    console.log("* public_id for the uploaded image is generated by Cloudinary's service.");
                    let url = result?.secure_url
                    resolve(url)
                }  
                
            })
            streamifier.createReadStream(file.buffer).pipe(uploadStream)
        })
    }
}

