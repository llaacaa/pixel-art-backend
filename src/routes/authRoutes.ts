import express from "express";
import asyncHandler from "../utils/catchAsync";
import { login, register, logout } from "../controllers/authControllers";
import { noTokenCheck } from "../utils/jsonWebToken";

const authRouter = express.Router();

authRouter.post("/register", noTokenCheck, asyncHandler(register));

authRouter.post("/login", noTokenCheck, asyncHandler(login));

authRouter.post("/logout", asyncHandler(logout));

export default authRouter;
