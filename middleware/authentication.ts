import { Request, Response, NextFunction } from "express";
import { UnAuthenticatedError, UnauthorizedError } from "../errors/index.js";
import { isTokenValid } from "../utils/index.js";

interface TokenPayload {
  fName: string;
  lName: string;
  email: string;
  userId: string;
  // Add other properties as needed
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload; // Assuming this matches the structure of the token payload
      admin?: {
        fName: string;
        lName: string;
        email: string;
        userId: string;
        role: string;
        uName: string;
      };
    }
  }
}

interface Token {
  token: string;
}

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnAuthenticatedError("Authentication invalid");
  }

  try {
    const payload = isTokenValid({ token }) as TokenPayload | undefined;
    if (!payload) {
      throw new UnAuthenticatedError("Authentication invalid");
    }
    const { fName, lName, email, userId } = payload;
    req.user = {
      fName,
      lName,
      email,
      userId,
    };
    next();
  } catch (error) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};

// const authenticateAdmin = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // check header
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer")) {
//     throw new UnAuthenticatedError("Authentication invalid");
//   }
//   const token = authHeader.split(" ")[1];

//   try {
//     const { fName, lName, email, userId, role, uName } = isTokenValid({
//       token,
//     });
//     req.admin = {
//       fName,
//       lName,
//       email,
//       userId,
//       role,
//       uName,
//     };
//     next();
//   } catch (error) {
//     throw new UnAuthenticatedError("Authentication Invalid");
//   }
// };

const authorizePermissions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if req.admin is defined and has role property
    const admin = req.admin;
    if (!admin || typeof admin !== "object") {
      throw new UnauthorizedError("Admin details not available");
    }

    const adminRoles = admin.role;

    // Check if there is at least one role in common between required roles and user roles
    const isAuthorized =
      roles.includes("admin") || roles.includes("superadmin")
        ? adminRoles === "admin" || adminRoles === "superadmin"
        : roles.some((role) => adminRoles === role);

    if (!isAuthorized) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};

export { authenticateUser, authorizePermissions };
