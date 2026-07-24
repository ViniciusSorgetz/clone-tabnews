import email from "infra/email";

async function sendEmailToUser(user) {
  await email.send({
    from: "Treenews <contato@treenews.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Treenews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Treenews: `,
  });
}

const activation = {
  sendEmailToUser,
};

export default activation;
