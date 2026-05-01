import Mailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = Mailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendResetLink = async (email:string , resetLink:string, mailOptions:any)=>{
   const response = await transporter.sendMail(mailOptions);
   console.log('Email sent: ' + response.response);
    
}