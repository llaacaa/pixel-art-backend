import { z, ZodIssue } from "zod";
import { Request, Response } from "express";
import { APIErrorCommon } from "../types/error";
import {
  BasePictureDto,
  GetPictureRes,
  NewPictureReq,
  NewPictureRes,
  PictureDto,
  PictureListingPage,
  UpdatePictureRes,
} from "../types/pictureTypes";
import Picture, { IPicture } from "../models/pictureModel";
import { AuthenticatedRequest } from "../types/authTypes";
import User from "../models/userModel";
import { SortOrder, Types } from "mongoose";

const nameSchema = z
  .string()
  .min(1, { message: "Name must be at least 1 character long." })
  .max(40, { message: "Name must not exceed 40 characters." });

const pictureDataSchema = z
  .array(
    z.array(
      z.string({
        invalid_type_error: "Each cell in picture_data must be a string.",
      })
    )
  )
  .nonempty({ message: "picture_data must be a non-empty 2D array." });

const checkNameAndPictureData = (
  name: string,
  picture_data: string[][]
): ZodIssue[] => {
  const issues: ZodIssue[] = [];

  const nameValidation = nameSchema.safeParse(name);
  if (!nameValidation.success) {
    issues.push(
      ...nameValidation.error.issues.map((issue) => ({
        ...issue,
        path: ["name", ...issue.path],
      }))
    );
  }

  const pictureDataValidation = pictureDataSchema.safeParse(picture_data);
  if (!pictureDataValidation.success) {
    issues.push(
      ...pictureDataValidation.error.issues.map((issue) => ({
        ...issue,
        path: ["picture_data", ...issue.path],
      }))
    );
  }

  return issues;
};

export const postPicture = async (req: AuthenticatedRequest, res: Response) => {
  const { name, picture_data } = req.body as NewPictureReq;

  const issues = checkNameAndPictureData(name, picture_data);
  if (issues.length > 0) {
    const nameAndPictureDataResponse: APIErrorCommon = {
      failed: true,
      code: "INVALID_DATA",
      extra: issues,
    };
    res.status(400).send(nameAndPictureDataResponse);
    return;
  }

  if (picture_data.length < 1 && picture_data.length > 24) {
    const badPictureFormatRespnse: APIErrorCommon = {
      failed: true,
      code: "BAD_PICTURE_DATA",
      extra: issues,
    };
    res.status(400).send(badPictureFormatRespnse);
    return;
  }

  const user_id = req.userData.userId;
  const user = await User.findOne({ user_id });

  const created_at = new Date().toISOString();
  const updated_at = created_at;

  const picture: IPicture = new Picture({
    author: user,
    created_at,
    updated_at,
    name,
    picture_data,
  });

  await picture.save();
  user?.pictures.push(picture._id as Types.ObjectId);
  await user?.save();

  const response: NewPictureRes = {
    failed: false,
    picture_id: picture.picture_id,
  };

  res.status(200).send(response);
};

export const getAllPictures = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      25
    );
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const author = req.query.author as string;
    const olderFirst = req.query.older_first === "true";

    const query: any = {};
    if (author) {
      const user = await User.findOne({ user_id: author });
      if (!user) {
        res.status(200).send({ pictures: [], total: 0 });
        return
      }
      query.author = user._id;
    }

    const skip = (page - 1) * limit;
    const sortOrder: { [key: string]: SortOrder } = {
      created_at: olderFirst ? 1 : -1,
    };

    const pictures = await Picture.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate("author", "user_id username")
      .lean();

    const total = await Picture.countDocuments(query);

    const response: PictureListingPage = {
      pictures: pictures.map((picture) => {
        return {
          picture_id: picture.picture_id,
          name: picture.name,
          created_at: picture.created_at,
          updated_at: picture.updated_at,
          author: {
            user_id: picture.author.user_id,
            username: picture.author.username
          },
          picture_data: picture.picture_data,
        };
      }),
      total,
    };

    res.status(200).send(response);
  } catch (error) {
    console.error("Error in getAllPictures:", error);
    const errorResponse: APIErrorCommon = {
      failed: true,
      code: "INTERNAL_ERROR",
    };
    res.status(400).send(errorResponse);
  }
};
export const getPictureById = async (req: Request, res: Response) => {
  const { pictureId } = req.params;
  const pictureDB = await Picture.findOne({ picture_id: pictureId }).populate(
    "author"
  );

  if (!pictureDB) {
    const noPictureResponse: APIErrorCommon = {
      failed: true,
      code: "NO_SUCH_ENTITY",
    };
    res.status(400).send(noPictureResponse);
    return;
  }

  const picture: PictureDto = {
    name: pictureDB.name,
    author: {
      user_id: pictureDB.author.user_id,
      username: pictureDB.author.username,
    },
    created_at: pictureDB.created_at,
    updated_at: pictureDB.updated_at,
    picture_data: pictureDB.picture_data,
    picture_id: pictureDB.picture_id,
  };

  const response: GetPictureRes = {
    failed: false,
    picture,
  };
  res.status(200).send(response);
};

export const updatePicture = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { pictureId } = req.params;
  const { name, picture_data } = req.body as Partial<BasePictureDto>;

  const pictureDB = await Picture.findOne({ picture_id: pictureId }).populate(
    "author"
  );

  if (!pictureDB) {
    return res.status(404).send({
      failed: true,
      code: "NO_SUCH_ENTITY",
    } as APIErrorCommon);
  }

  const userIdFromToken = req.userData.userId;
  const author = pictureDB.author;

  if (author.user_id !== userIdFromToken) {
    return res.status(403).send({
      failed: true,
      code: "NOT_YOURS",
    } as APIErrorCommon);
  }

  const newUpdate = new Date().toISOString();

  if (name) {
    pictureDB.name = name;
    pictureDB.updated_at = newUpdate;
  }
  if (picture_data) {
    pictureDB.picture_data = picture_data;
    pictureDB.updated_at = newUpdate;
  }

  await pictureDB.save();

  return res.status(200).send({
    failed: false,
  } as UpdatePictureRes);
};

export const deletePicture = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { pictureId } = req.params;
  const pictureDB = await Picture.findOne({ picture_id: pictureId }).populate(
    "author"
  );
  if (!pictureDB) {
    const noPictureResponse: APIErrorCommon = {
      failed: true,
      code: "NO_SUCH_ENTITY",
    };
    res.status(404).send(noPictureResponse);
    return;
  }

  const userIdFromToken = req.userData.userId;
  const author = pictureDB.author;

  if (author.user_id !== userIdFromToken) {
    return res.status(403).send({
      failed: true,
      code: "NOT_YOURS",
    } as APIErrorCommon);
  }

  await Picture.findByIdAndDelete(pictureDB._id);

  const response: UpdatePictureRes = { failed: false };
  res.send(200).send(response);
};
