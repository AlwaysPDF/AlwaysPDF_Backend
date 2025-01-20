import express, { Request, Response } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();

import "express-async-errors";
import morgan from "morgan";
import cors from "cors";
// import helmet from "helmet"; // Import Helmet directly

// Serve static files from the 'public' directory
// app.use(express.static("public"));

// import http from "http";
// import { Server, Socket } from "socket.io";

// const server = http.createServer(app);

// production
// import helmet from "helmet/index.cjs";
// account number
// 2427520473
// Zenith?

// local
// import helmet from 'helmet'

import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// db and authenticateUser
import connectDB from "./db/connect.js";

// routers
import authRouter from "./routes/authRoutes.js";

// user router
import userRouter from "./routes/userRoutes.js";

// ask questions router
import questionRouter from "./routes/askQuestionRoutes.js";

// document upload router
import documentUploadRouter from "./routes/documentUploadRoutes.js";

// message router
import messageRouter from "./routes/messageRoutes.js";

// payment router
import paymentRouter from "./routes/paymentRoutes.js";

// firebase router
// import firebaseRouter from "./routes/firebaseRoutes";

// middleware
import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";

import {
  authenticateUser,
  // authenticateAdmin,
} from "./middleware/authentication.js";

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// only when ready to deploy

app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true })); // Example middleware

app.use(xss());
app.use(mongoSanitize());
// Use Helmet middleware
// app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://testalwayspdf.vercel.app",
      "https://alwayspdf.com",
      "www.alwayspdf.com",
      "https://www.alwayspdf.com",
    ],
    credentials: true,
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/documentUpload", authenticateUser, documentUploadRouter);
app.use("/api/v1/questions", authenticateUser, questionRouter);
app.use("/api/v1/messages", authenticateUser, messageRouter);
app.use("/api/v1/payment", paymentRouter);

// Base Route for the server
app.get("/", (req: Request, res: Response) => {
  res.send(
    '<html> <head><link rel="preconnect" href="https://fonts.googleapis.com"/>' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" />' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>' +
      '<title>AlwaysPDF</title></head><body style="background-color: black; color: white; font-family: Montserrat, sans-serif; display: flex; justify-content: center; align-items: center;" height: 100vh; flex-direction: column;><h3>AlwaysPDF server is running!</h3> <a target="_blank" style="text-decoration: none; color: white; font-weight: bold;" href="https://alwayspdf.com/">Visit live Site</a></body></html>'
  );
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// declare global {
//   var onlineUsers: Map<string, string>;
//   var chatSocket: any;
// }

const port = process.env.PORT || 5000;

const start = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error("MONGO_URL environment variable is not defined.");
    process.exit(1); // Exit the process with a failure code
  }

  try {
    await connectDB(mongoUrl);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();

// const start = async () => {
//   const mongoUrl = process.env.MONGO_URL;

//   if (!mongoUrl) {
//     console.error("MONGO_URL environment variable is not defined.");
//     process.exit(1); // Exit the process with a failure code
//   }

//   try {
//     await connectDB(mongoUrl);

//     // Attach Socket.IO to the existing HTTP server
//     const io = new Server(server, {
//       cors: {
//         origin: [
//           "http://localhost:3000",
//           "http://localhost:3001",
//           "https://testalwayspdf.vercel.app",
//           "https://alwayspdf.com",
//           "www.alwayspdf.com",
//           "https://www.alwayspdf.com",
//         ],
//         credentials: true,
//       },
//     });

//     global.onlineUsers = new Map();

//     io.on("connection", (socket: Socket) => {
//       console.log("New user connected:", socket.id);
//       global.chatSocket = socket;

//       socket.on("add-user", (userId: string) => {
//         global.onlineUsers.set(userId, socket.id);
//         console.log(`User ${userId} added with socket ID: ${socket.id}`);
//       });

//       socket.on("send-msg", (data: { to: string; msg: string }) => {
//         const sendUserSocket = global.onlineUsers.get(data.to);
//         if (sendUserSocket) {
//           socket.to(sendUserSocket).emit("msg-recieve", data.msg);
//           console.log(
//             `Message sent from ${socket.id} to ${sendUserSocket}: ${data.msg}`
//           );
//         }
//       });
//       // Handle user disconnect
//       socket.on("disconnect", () => {
//         global.onlineUsers.forEach((value, key) => {
//           if (value === socket.id) {
//             global.onlineUsers.delete(key);
//             console.log(`User ${key} with socket ID ${socket.id} disconnected`);
//           }
//         });
//       });
//     });

//     server.listen(port, () => {
//       console.log(`Server is listening on port ${port}...`);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };