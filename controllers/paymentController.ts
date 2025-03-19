import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_LIVE,
} from "../utils/index.js";
import Stripe from "stripe";

import Payment from "../models/Payment.js";
import User from "../models/User.js";

const stripe = new Stripe(STRIPE_SECRET_KEY_LIVE, {
  apiVersion: "2024-12-18.acacia",
});

const paymentHandler = async (req: Request, res: Response) => {
  if (req.method === "POST") {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: req.user?.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Subscription Payment",
                description: "$9.90/Month subscription",
              },
              unit_amount: 990, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/success`,
        cancel_url: `${req.headers.origin}/failed`,
        payment_intent_data: {
          metadata: {
            userId: req.user?.userId, // Pass metadata to the payment intent
            email: req.user?.email,
          },
        },
        // metadata: {
        //   userId: req.user?.userId,
        //   email: req.user?.email,
        // },
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
      case "charge.succeeded":
      case "charge.captured":
      case "charge.expired":
      case "charge.failed":
      case "charge.pending":
      case "charge.refunded":
      case "charge.updated":
        const charge = event.data.object as Stripe.Charge;

        // if (session.payment_status === "paid") {
        const metadata = charge.metadata || {};
        const paymentDetails = {
          userId: metadata.userId || "unknown",
          email: metadata.email || "unknown",
          amount: charge.amount / 100, // Convert to dollars
          currency: charge.currency || "usd",
          paymentStatus: charge.status || "unknown",
          sessionId: charge.id,
          eventType: event.type,
        };

        try {
          await Payment.create(paymentDetails);
          console.log("Payment saved to database:", paymentDetails);
        } catch (err: any) {
          console.error("Database Error:", err.message);
        }

        // Update user tier to "premium" only for charge.succeeded
        if (event.type === "charge.succeeded") {
          try {
            // Calculate subscription start and end dates
            const subscriptionStartDate = new Date(); // Current date and time
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

            // Assuming you have a User model and a method to update the user's tier
            const user = await User.findOneAndUpdate(
              { _id: metadata.userId }, // Find user by userId from metadata
              {
                tier: "Premium",
                subscriptionStatus: "Active",
                subscriptionStartDate,
                subscriptionEndDate,
              }, // Update tier to "premium"
              { new: true } // Return the updated user
            );

            if (user) {
              console.log("User tier updated to premium:", user);
            } else {
              console.error("User not found:", metadata.userId);
            }
          } catch (err: any) {
            console.error("Error updating user tier:", err.message);
          }
        }
        break;

      case "charge.failed":
        console.log("Payment failed:", event.data.object);
        break;

      case "charge.pending":
        console.log("Payment Pending:", event.data.object);
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

export { paymentHandler, webhookHandler };
