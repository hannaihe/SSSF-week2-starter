import {validationResult} from 'express-validator';
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import catModel from '../models/catModel';
import rectangleBounds from '../../utils/rectangleBounds';
import {Cat} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';

// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cats = await catModel.find({
      owner: res.locals.user._id,
    });
    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }

    const {topRight, bottomLeft} = req.query;
    const [topRightLat, topRightLng] = topRight.split(',');
    const [bottomLeftLat, bottomLeftLng] = bottomLeft.split(',');

    const rectBounds = rectangleBounds(
      {lng: parseInt(topRightLat), lat: parseInt(topRightLng)},
      {lat: parseInt(bottomLeftLat), lng: parseInt(bottomLeftLng)}
    );

    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $geometry: rectBounds,
        },
      },
    });

    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

// - catPutAdmin - only admin can change cat owner
const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if (res.locals.user.role === 'admin') {
      const cat = await catModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!cat) {
        next(new CustomError('Cat not found', 404));
        return;
      }
      const output = {
        message: 'Cat updated',
        data: cat,
      };
      res.json(output);
    }
  } catch (error) {
    console.error(error);
    next(new CustomError((error as Error).message, 500));
  }
};
// - catDeleteAdmin - only admin can delete cat
const catDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if (res.locals.user.role === 'admin') {
      const cat = await catModel
        .findByIdAndDelete(req.params.id)
        .populate('owner');
      if (!cat) {
        next(new CustomError('No cat found', 404));
        return;
      }
      const output = {
        message: 'Cat deleted',
        data: cat,
      };
      res.json(output);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
// - catDelete - only owner can delete cat
const catDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('No cat found', 404));
      return;
    }
    const output = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
// - catPut - only owner can update cat
const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const output = {
      message: 'Cat updated',
      data: cat,
    };
    res.json(output);
  } catch (err) {
    next(new CustomError((err as Error).message, 500));
  }
};
// - catGet - get cat by id
const catGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const cat = await catModel
      .findById(req.params.id)
      .populate('owner', 'user_name email');
    if (!cat) {
      next(new CustomError('No cat found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
// - catListGet - get all cats
const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catModel.find().populate('owner', 'user_name email');
    if (!cats) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
// - catPost - create new cat
const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    if (!req.file) {
      throw new CustomError('File not found', 400);
    }

    req.body.location = res.locals.coords;
    const user = res.locals.user;
    req.body.owner = user._id;
    req.body.filename = req.file.filename;

    const cat = await catModel.create(req.body);
    const output = {
      message: 'Cat created',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    console.error(error);
    next(new CustomError((error as Error).message, 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
  catDeleteAdmin,
};
