import { Request, response, Response } from "express";
import User from "../models/userModel";
import {
  LoginReq,
  LoginRes,
  UserCreationReq,
  UserCreationRes,
} from "../types/authTypes";
import { Encrypt } from "../utils/bcryptEncription";
import jsonWebToken from "../utils/jsonWebToken";
import { APIErrorCommon } from "../types/error";
import { z, ZodIssue } from "zod";

const passwordSchema = z
  .string()
  .min(9, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password must not exceed 128 characters" });

const checkUsernameAndPassword: (
  username: string,
  password: string
) => ZodIssue[] | [] = (username: string, password: string) => {
  const issues: ZodIssue[] = [];
  if (!username) {
    issues.push({
      code: "custom",
      message: "Username cannot be null or empty",
      path: ["username"],
    });
  }
  if (!password) {
    issues.push({
      code: "custom",
      message: "Password cannot be null or empty",
      path: ["password"],
    });
  }
  return issues;
};

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body as UserCreationReq;

  const issues = checkUsernameAndPassword(username, password);
  if (issues.length > 0) {
    const errorNoData: APIErrorCommon = {
      failed: true,
      code: "INVALID_DATA",
      extra: issues,
    };
    return res.status(401).send(errorNoData);
  }

  const validation = passwordSchema.safeParse(password);
  if (!validation.success) {
    const issues: ZodIssue[] = validation.error.issues;
    const invalidPasswordResponse: APIErrorCommon = {
      failed: true,
      code: "INVALID_DATA",
      extra: issues,
    };
    res.status(400).send(invalidPasswordResponse);
    return
  }

  const searchUser = await User.findOne({ username });
  if (searchUser) {
    const duplicateUsernameResponse: APIErrorCommon = {
      failed: true,
      code: "DUPLICATE_USERNAME",
    };
    res.status(400).send(duplicateUsernameResponse);
    return 
  }

  const hashedPassword = await Encrypt.cryptPassword(password);
  const user = new User({
    username,
    password: hashedPassword,
  });

  await user.save();

  const response: UserCreationRes = { failed: false, user_id: user.user_id };

  return res.status(200).send(response);
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginReq;
  const issues = checkUsernameAndPassword(username, password);
  if (issues.length > 0) {
    const errorNoData: APIErrorCommon = {
      failed: true,
      code: "INVALID_DATA",
      extra: issues,
    };
    res.status(401).send(errorNoData);
    return;
  }
  const searchUser = await User.findOne({ username });

  if (searchUser) {
    const isPasswordValid = await Encrypt.comparePassword(
      password,
      searchUser.password
    );
    if (!isPasswordValid) {
      const invalidPassword: APIErrorCommon = {
        failed: true,
        code: "INCORRECT_CREDENTIALS",
      };
      res.status(401).send(invalidPassword);
      return;
    }
  } else {
    const noUserResponse: APIErrorCommon = {
      failed: true,
      code: "INCORRECT_CREDENTIALS",
    };
    res.status(401).send(noUserResponse);
    return 
  }

  const token = jsonWebToken.generateToken(searchUser!.user_id);

  const response: LoginRes = {
    failed: false,
    token,
    user_id: searchUser!.user_id,
    username: searchUser!.username,
  };

  return res.status(200).send(response);
};
export const logout = async (req: Request, res: Response) => {};
