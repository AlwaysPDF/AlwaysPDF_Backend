import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_LIVE,
} from "../utils/index.js";
import Stripe from "stripe";

import Payment from "../models/Payment.js";

const stripe = new Stripe(STRIPE_SECRET_KEY_LIVE, {
  apiVersion: "2024-12-18.acacia",
});

const paymentHandler = async (req: Request, res: Response) => {
  if (req.method === "POST") {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: req?.user?.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Subscription Payment",
                description: "$9.90/Month subscription",
              },
              unit_amount: 40, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/success`,
        cancel_url: `${req.headers.origin}/failed`,
        metadata: {
          userId: req?.user?.userId,
          email: req?.user?.email,
        },
      } as Stripe.Checkout.SessionCreateParams);

      // Return the session ID to the client
      res.status(StatusCodes.OK).json({ success: true, sessionId: session.id });
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ success: false, msg: "Method Not Allowed" });
  }
};

const webhookHandler = async (req: Request, res: Response) => {
  if (req.method === "POST") {
    const sig = req.headers["stripe-signature"];
    // With express.raw middleware, req.body should already be a Buffer
    const payload = req.body;

    if (!sig) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Missing Stripe Signature" });
    }

    let event: Stripe.Event;

    try {
      // Use the raw body from the request
      event = stripe.webhooks.constructEvent(
        payload, // Use the raw body
        sig,
        STRIPE_WEBHOOK_SECRET_LIVE
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid") {
          const metadata = session.metadata || {};
          const paymentDetails = {
            userId: metadata.userId || "unknown",
            email: metadata.email || "unknown",
            amount: (session.amount_total || 0) / 100, // Convert to dollars
            currency: session.currency || "usd",
            paymentStatus: session.payment_status || "unknown",
            sessionId: session.id,
            eventType: event.type,
          };

          try {
            await Payment.create(paymentDetails);
            console.log("Payment saved to database:", paymentDetails);
          } catch (err: any) {
            console.error("Database Error:", err.message);
          }
        }
        break;

      case "checkout.session.async_payment_failed":
        console.log("Payment failed:", event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.status(StatusCodes.OK).json({ success: true, msg: "Webhook received" });
  } else {
    res.setHeader("Allow", "POST");
    res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ success: false, msg: "Method Not Allowed" });
  }
};

// const paymentHandler = async (req: Request, res: Response) => {
//   if (req.method === "POST") {
//     try {
//       const session = await stripe.checkout.sessions.create({
//         payment_method_types: ["card"],
//         customer_email: req?.user?.email,
//         // billing_address_collection: "auto",
//         line_items: [
//           {
//             price_data: {
//               currency: "usd",
//               product_data: {
//                 name: "Premium Subscription Payment",
//                 description: "$9.90/Month subscription",
//               },
//               unit_amount: 10, // Amount in cents
//               // recurring: {
//               //   interval: "month",
//               // },
//             },
//             quantity: 1,
//           },
//         ],
//         mode: "payment",
//         // mode: "subscription",
//         success_url: `${req.headers.origin}/success`,
//         cancel_url: `${req.headers.origin}/failed`,
//         metadata: {
//           userId: req?.user?.userId,
//           email: req?.user?.email,
//         },
//       } as Stripe.Checkout.SessionCreateParams);

//       res.status(StatusCodes.OK).json({ success: true, sessionId: session.id });

//       try {
//         // Simulate webhook in the background
//         (async () => {
//           const simulatedEvent = {
//             id: "we_1QilzvLOTQKmd0QoAdFNnSFi",
//             object: "event",
//             type: "checkout.session.completed",
//             data: {
//               object: session,
//             },
//           };

//           const simulatedReq = {
//             method: "POST",
//             headers: { "stripe-signature": STRIPE_WEBHOOK_SECRET_LIVE },
//             body: simulatedEvent,
//           } as unknown as Request;

//           const simulatedRes = {
//             status: (code: number) => ({
//               json: (data: any) => console.log("Webhook Response:", code, data),
//               send: (data: string) =>
//                 console.log("Webhook Response:", code, data),
//             }),
//             setHeader: () => {},
//             end: () => {},
//           } as unknown as Response;

//           await webhookHandler(simulatedReq, simulatedRes);
//         })();
//       } catch (webhookError) {
//         console.error("Webhook simulation failed:", webhookError);
//         // Could add monitoring/alerting here
//       }
//     } catch (err: any) {
//       console.log(err);

//       res
//         .status(StatusCodes.INTERNAL_SERVER_ERROR)
//         .json({ success: false, error: err.message });
//     }
//   } else {
//     res.setHeader("Allow", "POST");
//     res
//       .status(StatusCodes.METHOD_NOT_ALLOWED)
//       .json({ success: false, msg: "Method Not Allowed" });
//   }
// };

// const webhookHandler = async (req: Request, res: Response) => {
//   if (req.method === "POST") {
//     const sig = req.headers?.["stripe-signature"];
//     if (!sig) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ success: false, msg: "Missing Stripe Signature" });
//     }

//     let event: Stripe.Event;

//     try {
//       const rawBody = (req as any).rawBody || "";
//       event = stripe.webhooks.constructEvent(
//         rawBody,
//         sig,
//         STRIPE_WEBHOOK_SECRET_LIVE
//       );
//     } catch (err: any) {
//       console.error("Webhook Error:", err.message);
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ success: false, msg: `Webhook Error: ${err.message}` });
//     }

//     // Handle the event
//     if (event.type === "checkout.session.completed") {
//       //  === "checkout.session.completed"
//       const session = event.data.object as Stripe.Checkout.Session;

//       // Example: Save payment details to your database
//       if (session.payment_status === "paid") {
//       const metadata = session.metadata || {};
//       const paymentDetails = {
//         userId: metadata.userId || "unknown",
//         email: metadata.email || "unknown",
//         amount: (session.amount_total || 0) / 100, // Handle null amount_total
//         currency: session.currency || "usd",
//         paymentStatus: session.payment_status || "unknown",
//         sessionId: session.id,
//         eventType: event.type,
//       };

//       try {
//         await Payment.create(paymentDetails);
//         console.log("Payment saved to database:", paymentDetails);
//       } catch (err: any) {
//         console.error("Database Error:", err.message);
//       }
//     }
//   }else if (event.type === "checkout.session.async_payment_failed") {
//     console.log("Payment failed:", event.data.object);
//   }

//     res
//       .status(StatusCodes.OK)
//       .json({ success: true, msg: "Payment Successful" });
//   } else {
//     res.setHeader("Allow", "POST");
//     res
//       .status(StatusCodes.METHOD_NOT_ALLOWED)
//       .json({ success: false, msg: "Method Not Allowed" });
//   }
// };

export { paymentHandler, webhookHandler };
