import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  lName: string;
  fName: string;
  // Add any other properties that you expect in the payload
}

interface TokenPayload {
  fName: string;
  lName: string;
  email: string;
  userId: string;
}

interface Token {
  token: string;
}

interface ResponseUser {
  res: any; // You can replace 'any' with the actual type of 'res' if you know it
  user: JwtPayload;
}

const createJWT = ({ userId, email, fName, lName }: JwtPayload): string => {
  const payload: TokenPayload = { userId, email, fName, lName };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const createAdminJWT = ({ userId, email, fName, lName }: JwtPayload): string => {
  const payload: TokenPayload = { userId, email, fName, lName };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = ({ token }: Token): TokenPayload | false => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload
    return decoded;
  } catch (error) {
    return false;
  }
};
const attachCookiesToResponse = ({ res, user }:ResponseUser): string => {
  const token = createJWT(user);

  return token;
};

export { createJWT, createAdminJWT, isTokenValid, attachCookiesToResponse };
