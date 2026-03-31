import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMPT_HOST,
  port: process.env.EMAIL_SMPT_PORT,
  auth: {
    user: process.env.EMAIL_SMPT_USER,
    pass: process.env.EMAIL_SMPT_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send({ from, to, subject, text }) {
  await transporter.sendMail({ from, to, subject, text });
}

const email = {
  send,
};

export default email;
