import jwt, { JwtPayload } from "jsonwebtoken";
import { RequestHandler } from "express";
import { APIErrorCommon } from "../types/error";
import { AuthenticatedRequest } from "../types/authTypes";
const secretKey = "your-secret-key";

const jsonWebToken = {
  generateToken: (userId: string): string => {
    return jwt.sign({ userId }, secretKey, { expiresIn: "1h" });
  },
  verifyToken: (token: string): JwtPayload | string | null => {
    try {
      return jwt.verify(token, secretKey) as JwtPayload;
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  },
};
export default jsonWebToken;

export const checkForToken: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    const invalidTokenError: APIErrorCommon = {
      failed: true,
      code: "NOT_AUTHENTICATED",
    };
    res.status(401).send(invalidTokenError);
    return;
  }
  try {
    const userData = jsonWebToken.verifyToken(token);
    if (!userData) {
      const invalidTokenError: APIErrorCommon = {
        failed: true,
        code: "NOT_AUTHENTICATED",
      };
      res.status(401).send(invalidTokenError);
      return;
    }

    req.userData = userData;

    next();
  } catch (err) {
    const ivalidTokenResponse: APIErrorCommon = {
      failed: true,
      code: "INVALID_TOKEN",
    };

    res.status(401).send(ivalidTokenResponse);
    return;
  }
};

export const noTokenCheck: RequestHandler = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    const tokenAvailableError: APIErrorCommon = {
      failed: true,
      code: "LOGGED_IN",
    };
    res.status(400).send(tokenAvailableError);
    return;
  }
  next();
};
