import * as dotenv from 'dotenv';
dotenv.config();

export const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
// export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const GOOGLE_DRIVE_APIKEY = process.env.GOOGLE_DRIVE_APIKEY

export const STRIPE_SECRET_KEY_LIVE = process.env.SECRET_STRIPE_SECRET_KEY_LIVE || ""

export const STRIPE_WEBHOOK_SECRET_TEST = process.env.STRIPE_WEBHOOK_SECRET_TEST || ""

export const STRIPE_WEBHOOK_SECRET_LIVE = process.env.STRIPE_WEBHOOK_SECRET_LIVE || ""