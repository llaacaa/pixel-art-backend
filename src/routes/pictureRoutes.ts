import express from "express";
import asyncHandler from "../utils/catchAsync";
import { checkForToken } from "../utils/jsonWebToken";
import {
  deletePicture,
  getAllPictures,
  getPictureById,
  postPicture,
  updatePicture,
} from "../controllers/pictureControllers";

const pictureRouter = express.Router();

pictureRouter
  .route("/")
  .post(checkForToken, asyncHandler(postPicture))
  .get(asyncHandler(getAllPictures));

pictureRouter
  .route("/:pictureId")
  .get(asyncHandler(getPictureById))
  .patch(checkForToken, asyncHandler(updatePicture))
  .delete(checkForToken, asyncHandler(deletePicture));

export default pictureRouter;
