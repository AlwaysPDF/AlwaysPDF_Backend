import sendEmail from "./sendEmail.js";

interface SendVerificationEmailParams {
  email: string;
  verificationToken: string;
  // images: EmailImages;
}

const sendVerificationEmail = async ({
  email,
  verificationToken,
}: //   origin,
SendVerificationEmailParams) => {
  const year = new Date().getFullYear();

  const bottomMessage = `<div style=" clear: both; width: 60%; background-color: #5A27D5; margin: auto; padding: 1rem 2rem; border-radius: 2rem; display: block;">
    <p style="color: #ffffff; text-align: center; margin-top: 1rem;">&copy; EverPDF ${year}</p>
    </div>`;

  const message = `<div style="background-color: #e2e2ff; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center;">
                        <div style="clear: both; width: 60%; background-color: #ffffff; margin: auto; padding: 2rem; border-radius: 2rem; display: block;">
                          <h4 style="margin-bottom: 1.2rem; font-size: 1.5rem; text-align: center;">Confirm your email</h4>
                          <hr />

                          <h6 style="font-size: 1.2rem;">Hello,</h6>

                          <p class="message-font">Thank you for registering with EverPDF. Your security is our top priority, and to ensure the protection of your account, we have initiated the process of verifying your identity.
                          </p> 

                          <p>To complete the registration process, please copy the code below to verify your email address.</p>

                          <p>Your OTP: <b>${verificationToken}</b></p>

                          <p>This link expires in 1 hour. You will need to request a new link after expiration.</p>
                        </div>

                        </div>`;
                        // ${bottomMessage}

  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html: `${message}`,
  });
};

export default sendVerificationEmail;

// import axios, { AxiosResponse } from "axios";

// interface EmailImages {

//   otpImage: string;
//   kampuslyLogo: string;
//   facebook?: string;
//   x?: string;
//   instagram?: string;
//   youtube?: string;
// }

// interface SendVerificationEmailParams {
//   email: string;
//   verificationToken: string;
//   images: EmailImages;
// }

// const fetchAndEncodeToBase64 = async (imageUrl: string) => {
//   try {
//     const response = await axios.get(imageUrl, {
//       responseType: "arraybuffer",
//     });

//     if (response.status === 200) {
//       const base64Image = Buffer.from(response.data).toString("base64");
//       return `data:image/png;base64,${base64Image}`;
//     } else {
//       throw new Error(`Failed to fetch image: ${imageUrl}`);
//     }
//   } catch (error) {
//     console.error(`Error fetching image ${imageUrl}:`, error);
//     throw error;
//   }
// };

// const convertImagesToBase64 = async (images: EmailImages): Promise<EmailImages> => {
//   try {
//     const base64Images: EmailImages = {} as EmailImages;
//     for (const placeholder in images) {
//         if (Object.prototype.hasOwnProperty.call(images, placeholder)) {
//           const imageUrl = images[placeholder as keyof EmailImages];
//           if (imageUrl) { // Check if imageUrl is defined
//             const base64Image = await fetchAndEncodeToBase64(imageUrl);
//             base64Images[placeholder as keyof EmailImages] = base64Image;
//           } else {
//             throw new Error(`Image URL for '${placeholder}' is undefined.`);
//           }
//         }
//     }
//     return base64Images;
//   } catch (error) {
//     throw error;
//   }
// };

// const sendVerificationEmail = async ({
//   email,
//   verificationToken,
//   images,
// }: SendVerificationEmailParams) => {
//   try {
//     const authToken = process.env.MAIL_TOKEN;

//     const base64Images = await convertImagesToBase64(images);

//     const year = new Date().getFullYear();

//     const message = `<div style="background-color: #EFEEEA; padding: 2rem 1.5rem;">
//                         <h4 style="margin-bottom: 1.2rem; font-size: 1.5rem;">One-Time password (OTP) for account verification</h4>

//                         <h6 style="font-size: 1.2rem;">Hello</h6>

//                         <p class="message-font">Thank you for choosing Kampusly! Your security is our top priority, and to ensure the protection of your account, we have initiated the process of verifying your identity.
//                         </p>

//                         <p>As part of our security measures, please find your One-Time Password (OTP) below which in an hour</p>

//                         <p>Your OTP: <b>${verificationToken}</b></p>

//                         <p>Please enter this code on the verification page to complete the authentication process. Ensure that you do not share this OTP with anyone for security reasons. If you did not initiate this verification process, please contact our support team immediately.</p>

//                         <p>Thank you for your cooperation in enhancing the security of your account with Kampusly.</p>

//                         <div style="display: flex; justify-content: center; align-items: center;">
//                           <a href="https://kampusly.ng/" style="background-color: rgba(254, 82, 0, 1); color: #ffffff; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.5rem;">Continue to Website</a>
//                         </div>
//                       </div>`;

//     const bottomMessage = `<div style="background-color: #EFEEEA;  margin: 0.5rem 0 0 0; padding: 2rem 1.5rem;">
//                       <span style="display: block; width: 20%;">
//                         <a href="https://kampusly.ng/">
//                           <img src="${base64Images.kampuslyLogo}">
//                         </a>
//                         </span>
//                         <span>
//                           <p style="color: rgba(254, 82, 0, 1);">&copy; ${year} Kampusly</p>
//                           </span>
//                       <div>
//                         <div>
//                           <p style="list-style: none;">Privacy Policy</p>
//                           <p style="list-style: none;">Terms & Conditions</p>
//                           <p style="list-style: none;">Contact Us</p>
//                         </div>
//                       </div>

//                 </div>
//                     <div style="display: flex; justify-content: center; align-items: center; margin: 1.5rem 0 0 0; width: 100%;">
//                       <span style="display: block;"><a href="https://instagram.com/kampusly?igshid=NTc4MTIwNjQ2YQ==" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.instagram}"></a>
//                       </span>
//                       <span style="display: block;"><a href="https://kampusly.ng/" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.facebook}"></a>
//                       </span>
//                       <span style="display: block;"><a href="https://twitter.com/kampuslyng?s=21&t=78gIeEuR5y0tmBlepc8fJA" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.x}"></a>
//                       </span>
//                       <span style="display: block;"><a href="https://kampusly.ng/" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.youtube}"></a>
//                        </span>
//                     </div>`;

//     const response: AxiosResponse = await axios.post(
//       "https://api.reni.tech/reni-mail/v1/sendSingleMail",
//       {
//         email: email,
//         subject: "[KAMPUSLY] Activate your email",
//         body: `<body style="padding: 0; margin: 0; box-sizing: border-box;">
//                   <div style="">
//                     <a href="#" style="width: 100%;">
//                       <img src="${base64Images.otpImage}">
//                     </a>
//                     ${message}
//                     ${bottomMessage}
//                   </div>
//                 </body>
//       `,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${authToken}`,
//         },
//       }
//     );

//     // Handle the response as needed
//     console.log(response.data);
//   } catch (error) {
//     // Handle errors
//     console.error("Error sending verification email:", error);
//   }
// };

// export default sendVerificationEmail;
