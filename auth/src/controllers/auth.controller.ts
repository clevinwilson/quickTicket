import type { Types } from "mongoose";
import { User } from "../models/users.model.ts";
import { ApiError } from "../utils/api-error.ts";
import { ApiResponse } from "../utils/api-response.ts";
import { asyncHandler } from "../utils/async-handler.ts"

const generateAccessToken = async (userId: Types.ObjectId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    try {
        const accessToken = user.generateAccessToken();
        return { accessToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token");
    }
}

const signup = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
        email
    })

    if (existingUser) {
        throw new ApiError(409, "User with email already exist");
    }

    const user = await User.create({
        email,
        password
    })

    user.save();

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
        throw new ApiError(500, "Something wet wrong while creating user")
    }

    const { accessToken } = await generateAccessToken(createdUser._id);

    req.session = {
        jwt: accessToken
    };
    return res.status(201).json(new ApiResponse(200, { user: createdUser }, "User registered successfull"))
})

export {
    signup
}