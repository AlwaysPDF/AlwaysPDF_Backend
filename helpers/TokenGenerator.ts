import crypto from "crypto";
import { createHash } from "../utils/index.js";

const TokenGenerator = async () => {
  const bytes = crypto.randomBytes(3); // Get 3 random bytes
  const number = bytes.readUIntBE(0, 3); // Read 3 bytes (24 bits)
  const sixDigitNumber = number % 1000000; // Make sure it's in 000000–999999 range

  const verificationToken: string = sixDigitNumber.toString().padStart(6, "0");

  const sixtyMinutes = 1000 * 60 * 60;
  const verificationTokenExpirationDate = new Date(Date.now() + sixtyMinutes);

  const finalVerificationToken = createHash(verificationToken);

  return {
    finalVerificationToken,
    verificationToken,
    verificationTokenExpirationDate,
  };
};

export default TokenGenerator;
