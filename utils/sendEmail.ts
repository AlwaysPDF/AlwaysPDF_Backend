import nodemailer from 'nodemailer'
import nodemailerConfig from './nodemailerConfig.js'

const sendEmail = async ({ to, subject, html } :any) => {
  let testAccount = await nodemailer.createTestAccount()

  const transporter = nodemailer.createTransport(nodemailerConfig)

  return transporter.sendMail({
    from: '"AlwaysPDF" <ajibolaisaac09@gmail.com>', // sender address
    to,
    subject,
    html,
  })
}

export default sendEmail
