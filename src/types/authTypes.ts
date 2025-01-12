import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  userData?: any;
}

// REGISTER
export type UserCreationReq = {
  username: string;
  password: string;
};

export type UserCreationRes = {
  failed: false;
  user_id: string;
};

// LOGIN
export type LoginReq = {
  username: string;
  password: string;
};
export type LoginRes = {
  failed: false;
  token: string;
  user_id: string;
  username: string;
};
