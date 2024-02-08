import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';
import bcrypt from 'bcryptjs';
import CustomError from '../../classes/CustomError';
import userModel from '../models/userModel';
import {User, UserOutput} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';

// - userGet - get user by id
const userGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const user = await userModel
      .findById(req.params.id)
      .select('_id user_name email');
    res.json(user);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
// - userListGet - get all users
const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role');
    if (!users) {
      next(new CustomError('No users found', 404));
    }

    res.json(users);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

// - userPost - create new user. Remember to hash password
const userPost = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse & {data: UserOutput}>,
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
    const {password} = req.body;
    const salt = bcrypt.genSaltSync(12);
    req.body.password = bcrypt.hashSync(password, salt);
    const user = await userModel.create({...req.body, role: 'user'});
    const output = {
      message: 'User created',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    };
    res.json(output);
  } catch (error) {
    console.log(error);
    next(new CustomError((error as Error).message, 500));
  }
};
// - userPutCurrent - update current user
const userPutCurrent = async (
  req: Request,
  res: Response<MessageResponse & {data: UserOutput}>,
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
    const user = await userModel.findByIdAndUpdate(
      res.locals.user._id,
      req.body,
      {
        new: true,
      }
    );

    if (!user) {
      next(new CustomError('Not found', 404));
      return;
    }
    const output = {
      message: 'User modified',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    };
    res.json(output);
  } catch (error) {
    console.error(error);
    next(new CustomError((error as Error).message, 500));
  }
};
// - userDeleteCurrent - delete current user
const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req.params);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => {
          `${error.msg}: ${error.param}`;
        })
        .join(', ');
      throw new CustomError(messages, 400);
    }
    const user = await userModel.findByIdAndDelete(
      res.locals.user._id,
      req.body
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const output = {
      message: 'User deleted',
      data: {
        _id: res.locals.user._id,
        user_name: res.locals.user.user_name,
        email: res.locals.user.email,
      },
    };
    res.json(output);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query
const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user) {
    next(new CustomError('Token is not valid', 403));
  } else {
    const newUser: User = res.locals.user as User;
    const output = {
      _id: newUser._id,
      user_name: newUser.user_name,
      email: newUser.email,
    };
    res.json(output);
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
