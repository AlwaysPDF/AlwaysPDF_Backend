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

// const sendWelcomeEmail = async ({ email, fName, images }) => {
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

//     const message = `<div style="background-color: #EFEEEA; padding: 2rem 1.5rem;">
//                         <h4 style="margin-bottom: 1.2rem; width: 100%; font-size: 1.5rem;"> We are very much glad to welcome you onboard!</h4>

//                         <p>Welcome to Kampusly, where the journey to hassle-free student living begins!
//                         </p> 

//                         <p>We're thrilled to have you on board as a new member of our community. Whether you're searching for the perfect roommate, connecting with friends, or exploring housing options, Kampusly is here to make your university experience memorable.
//                         </p>

//                         <p>Thank you for choosing Kampusly for your student living journey. We can't wait to see the friendships you build, the memories you create, and the exciting adventures that await you.</p>

//                         <p>Happy exploring!</p>

//                         <p>Best regards,</p>

//                         <div style="display: flex; justify-content: center; align-items: center;">
//                           <a href="https://kampusly.ng/" style="background-color: rgba(254, 82, 0, 1); color: #ffffff; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.5rem;">Continue to Website</a>
//                         </div>
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
//       "https://api.reni.tech/reni-mail/v1/sendSingleMail",
//       {
//         email: email,
//         subject: `[KAMPUSLY] Welcome ${fName}`,
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

// export default sendWelcomeEmail;
