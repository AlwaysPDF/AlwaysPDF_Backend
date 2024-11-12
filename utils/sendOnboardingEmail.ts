// import axios from "axios";

// const fetchAndEncodeToBase64 = async (imageUrl) => {
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

// const convertImagesToBase64 = async (images) => {
//   try {
//     const base64Images = {};
//     for (const placeholder in images) {
//       const imageUrl = images[placeholder];
//       const base64Image = await fetchAndEncodeToBase64(imageUrl);
//       base64Images[placeholder] = base64Image;
//     }
//     return base64Images;
//   } catch (error) {
//     throw error;
//   }
// };

// const sendOnboardingEmail = async ({ email, fName, images }) => {
//   try {
//     const authToken = process.env.MAIL_TOKEN;

//     const base64Images = await convertImagesToBase64(images);

//     // const base64Images = {};
//     // for (const placeholder in images) {
//     //   const imagePath = images[placeholder];
//     //   const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });
//     //   base64Images[placeholder] = "data:image/png;base64," + base64Image;
//     // }

//     const year = new Date().getFullYear();

//     const message = `<div style="background-color: #EFEEEA; padding: 1.5rem 1.5rem 2rem 1.5rem;">
//                         <h4 style="margin-bottom: 1.2rem; width: 100%; font-size: 1.5rem;">Dear ${fName}</h4>

//                         <p>Greetings from Kampusly! We hope this message finds you well and excited to embark on your student journey with us. 
//                         </p> 

//                         <p>First and foremost, we want to extend a warm welcome to our growing Kampusly family! It's fantastic to have you on board, and we're thrilled to be a part of your housing search adventure.
//                         </p>

//                         <p>At Kampusly, we're dedicated to making your housing experience as smooth and stress-free as possible. Whether you're searching for the perfect roommate, exploring accommodation options, or simply looking to connect with fellow students, we've got you covered every step of the way.
//                         </p>

//                         <p>
//                         Let's get to the next step.
//                         </p>

//                         <ul>
//                             <li><p>
//                             Complete Your Profile: Let's get to know you better! Head over to your Kampusly account and complete your profile. The more we know, the better we can match you with the ideal roommate. Click <a href="https://kampusly.ng/Profile" style="background-color: rgba(254, 82, 0, 1); color: #ffffff; padding: 0.2rem 0.6rem; text-decoration: none; border-radius: 0.5rem;">here</a> to <b>complete profile</b> If you have completed your profile, let's connect 
//                             </p></li>

//                             <li><p>
//                             Stay Connected: Join our WhatsApp community for the latest updates, exclusive content, and a bit of banter. We promise it won't be boring! Click <a href="https://chat.whatsapp.com/JofAwpwSTUEBMSLSnjsCWs" style="background-color: rgba(254, 82, 0, 1); color: #ffffff; padding: 0.2rem 0.6rem; text-decoration: none; border-radius: 0.5rem;">here</a> to join. 
//                             </p></li>

//                             <li><p>
//                             Follow Us: Stay in the loop with all things Kampusly by following us on Instagram and Facebook. Trust us; you won't want to miss what's coming! 
//                             </p></li>

//                         </ul>

//                         <p>
//                         Get ready for an unforgettable journey filled with laughter, friendships, and memories that will last a lifetime. Stay tuned for more updates, tips, and insider insights from the Kampusly team. We're here to guide you through this new chapter of your life and ensure that you have an unforgettable student experience.
//                         </p>

//                         <p>
//                         Once again, welcome to Kampusly - let's make this student journey one for the books! I mean amazing, nothing shorts 
//                         </p>

//                         <p>Warm regards,</p>
//                         <p><b>Dave</b></p>
//                         <p>Kampusly Team 🧡</p>
//                       </div>
                      
                      
//                       `;

//     const bottomMessage = `<div style="background-color: #EFEEEA;  margin: 0.5rem 0 0 0; padding: 2rem 1.5rem;">
//           <span style="display: block; width: 20%;">
//             <a href="https://kampusly.ng/">
//               <img src="${base64Images.kampuslyLogo}">
//             </a>
//             </span> 
//             <span>
//               <p style="color: rgba(254, 82, 0, 1);">&copy; ${year} Kampusly</p>
//               </span>
//           <div>
//             <div>
//               <p style="list-style: none;">Privacy Policy</p>
//               <p style="list-style: none;">Terms & Conditions</p>
//               <p style="list-style: none;">Contact Us</p>
//             </div>
//           </div>

//     </div>
//         <div style="display: flex; justify-content: center; align-items: center; margin: 1.5rem 0 0 0; width: 100%;">
//           <span style="display: block;"><a href="https://instagram.com/kampusly?igshid=NTc4MTIwNjQ2YQ==" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.instagram}"></a>
//           </span>
//           <span style="display: block;"><a href="https://kampusly.ng/" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.facebook}"></a>
//           </span>
//           <span style="display: block;"><a href="https://twitter.com/kampuslyng?s=21&t=78gIeEuR5y0tmBlepc8fJA" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.x}"></a>
//           </span>
//           <span style="display: block;"><a href="https://kampusly.ng/" style="padding: 0.5rem 1rem; text-decoration: none;"><img src="${base64Images?.youtube}"></a>
//            </span>
//         </div>`;

//     const response = await axios.post(
//       // "https://sandbox.api.reni.tech/reni-mail/v1/sendSingleMail",
//       "https://api.reni.tech/reni-mail/v1/sendSingleMail",
//       {
//         email: email,
//         subject:
//           "Welcome to Kampusly: Are you ready to redefine your student experience?",
//         html: "true",
//         body: `<!DOCTYPE html>
//         <html lang="en">
//         <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Your Express App</title>
//         </head>
//         <body style="padding: 0; margin: 0; box-sizing: border-box;">
//                   <div style="">
//                     <a href="#" style="width: 100%;">
//                       <img src="${base64Images?.welcomeImage}">
//                     </a>
//                     ${message}
//                     ${bottomMessage}
//                   </div>
//                 </body>
//               </html>`,
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

// export default sendOnboardingEmail;
