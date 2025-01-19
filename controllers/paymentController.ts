import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_LIVE,
} from "../utils/index.js";
import Stripe from "stripe";

import Payment from "../models/Payment.js";

const stripe = new Stripe(STRIPE_SECRET_KEY_LIVE);

const paymentHandler = async (req: Request, res: Response) => {
  if (req.method === "POST") {
    try {
      const session = (await stripe.checkout.sessions.create) && {
        payment_method_types: ["card"],
        billing_address_collection: "auto",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Subscription Payment",
                description: "$9.90/Month subscription",
              },
              unit_amount: 100, // Amount in cents
            },
            recurring: {
              interval: "month",
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/success`,
        cancel_url: `${req.headers.origin}/cancel`,
        metadata: {
          userId: req?.user?.userId,
          email: req?.user?.email,
        },
      };

      // Simulate webhook event after payment session creation
      const simulatedEvent = {
        id: "we_1QilzvLOTQKmd0QoAdFNnSFi",
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: session,
        },
      };

      // Call webhook handler with simulated event
      const simulatedReq = {
        method: "POST",
        headers: { "stripe-signature": STRIPE_WEBHOOK_SECRET_LIVE }, // Add a valid signature for production
        body: simulatedEvent,
      } as unknown as Request;

      const simulatedRes = {
        status: (code: number) => ({
          json: (data: any) => console.log("Webhook Response:", code, data),
          send: (data: string) => console.log("Webhook Response:", code, data),
        }),
        setHeader: () => {},
        end: () => {},
      } as unknown as Response;

      await webhookHandler(simulatedReq, simulatedRes);

      res.status(StatusCodes.OK).json({ success: true, id: session });
    } catch (err: any) {
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
    const sig = req.headers?.["stripe-signature"];
    if (!sig) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Missing Stripe Signature" });
    }

    let event: Stripe.Event;

    try {
      const rawBody = (req as any).rawBody || "";
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET_LIVE
      );
    } catch (err: any) {
      console.error("Webhook Error:", err.message);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Example: Save payment details to your database
      const metadata = session.metadata || {};
      const paymentDetails = {
        userId: metadata.userId || "unknown",
        email: metadata.email || "unknown",
        amount: (session.amount_total || 0) / 100, // Handle null amount_total
        currency: session.currency || "usd",
        payment_status: session.payment_status || "unknown",
        session_id: session.id,
      };

      try {
        await Payment.create(paymentDetails);
        console.log("Payment saved to database:", paymentDetails);
      } catch (err: any) {
        console.error("Database Error:", err.message);
      }
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: "Payment Successful" });
  } else {
    res.setHeader("Allow", "POST");
    res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ success: false, msg: "Method Not Allowed" });
  }
};

export { paymentHandler };
