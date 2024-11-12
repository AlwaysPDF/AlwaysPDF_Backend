
// import axios from "axios";

// const sendResetPassswordEmail = async ({
//   fName,
//   email,
//   token,
// }) => {


//   const authToken = process.env.MAIL_TOKEN;

//   const message = `<p>Thank you for using KAMPUSLY, to reset your password, please input this Authentication Code on the confirmation page 
//   <h1>${token}</h1> </p>
//   <p><b>Please kindly note this token expires in 5 minutes</b></p>`;

//   try {
//     const response = await axios.post(
//       "https://api.reni.tech/reni-mail/v1/sendSingleMail",
//       {
//         email: email,
//         subject: "[KAMPUSLY] Reset Password",
//         body: `<h4 style="margin-bottom: 1.2rem;"> Hello, ${fName}</h4>
//       ${message}`,
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

// export default sendResetPassswordEmail;
