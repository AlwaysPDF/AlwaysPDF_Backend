import * as dotenv from 'dotenv';
dotenv.config();

export const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
// export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const GOOGLE_DRIVE_APIKEY = process.env.GOOGLE_DRIVE_APIKEY