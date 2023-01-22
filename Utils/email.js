const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email{
    constructor(user, url) {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = 'Shokeen Kalyan <${process.env.EMAIL_FROM}>'
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Use SendGrid (Create a account(Pending) on SendGrid for upto 100 free emails per day)
            return nodemailer.createTransport({ 
                service: 'SendGrid', // No need to define host and port unlike nodemailer
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
                // Use MailSac to create a disposable mail where all test emails can be sent to
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    async send(template, subject) {
        // Send the actual email
        
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })

        // 2) Define Email Options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            //text: htmlToText.fromString(html)
            text: htmlToText.convert(html)
        }

        // 3) Create a transport and send email
        this.newTransport()
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (Valid for only 10 minutes)')
    }

}

/*
const sendEmail = async options => {
    // 1) Create a transporter (A service that actually sends the email like gmail)
    
    
    //const transporter = nodemailer.createTransport({
    //    service: 'Gmail',
    //    auth: {
    //        user: process.env.EMAIL_USERNAME,
    //        pass: process.env.EMAIL_PASSWORD
    //    }
    //    // Activate in Gmail 'less secure app' option
    //})
    
    
    
    // We will be using Mailtrap for fake email sending and not gmail
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })
    

    
    // 2) Define the email options
    const mailOptions = {
        from: 'Shokeen Kalyan <shokeenkalyan2625@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    

    // 3) Send the email with Nodemailer
    // transporter.sendEmail is a asynchronous function
    // await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
*/
