export type BasePictureDto = {
  name: string;
  picture_data: string[][];
};

export type PictureDto = BasePictureDto & {
  picture_id: string;
  author: {
    user_id: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
};

export type NewPictureReq = BasePictureDto;
export type NewPictureRes = {
  failed: false;
  picture_id: string;
};

export type PictureListingPage = {
  pictures: PictureDto[];
  total: number;
};

export type GetPictureRes = {
  failed: false;
  picture: PictureDto;
};

export type UpdatePictureRes = {
  failed: false;
};

export type DeletePictureRes = {
  failed: false;
};
