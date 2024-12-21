import sendEmail from "./sendEmail.js";

interface SendRestPasswordEmaillParams {
  email: string;
  fName: string;
  token: string;
  // images: EmailImages;
}

const sendResetPasswordEmail = async ({
  email,
  fName,
  token,
}: SendRestPasswordEmaillParams) => {
  const year = new Date().getFullYear();

//   const bottomMessage = `<div style=" clear: both; width: 60%; background-color: #5A27D5; margin: auto; padding: 1rem 2rem; border-radius: 2rem; display: block;">
//     <p style="color: #ffffff; text-align: center; margin-top: 1rem;">&copy; EverPDF ${year}</p>
//     </div>`;

  const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 80%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.5rem; text-align: center;">Confirm your email</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello, ${fName}</h6>

                          <p class="message-font">Thank you for registering with EverPDF. Your security is our top priority, and to ensure the protection of your account, we have initiated the process of verifying your identity.
                          </p> 

                          <p>To complete the registration process, please copy the code below to verify your email address.</p>

                          <p>Your OTP: <b>${token}</b></p>

                          <p>This link expires in 1 hour. You will need to request a new link after expiration.</p>
                        </div>

                        </div>`;
  // ${bottomMessage}

  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: `${message}`,
  });
};

export default sendResetPasswordEmail;
