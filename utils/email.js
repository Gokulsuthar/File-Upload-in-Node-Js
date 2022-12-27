import nodemailer from "nodemailer";

class Email {
  constructor(email, text) {
    this.to = email;
    this.text = text;
    this.from = `Gokul Suthar <${process.env.MAIL_SENDER}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_SENDER,
        pass: process.env.MAIL_SENDER_PASSWORD,
      },
    });
  }

  async send(subject, text) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text,
    };
    
    await this.newTransport().sendMail(mailOptions)
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      `Your password reset token (valid for only 10 minutes) - ${this.text}`
    );
  }
  
}

export default Email;