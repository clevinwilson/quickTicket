import { User } from "../models/users.model.ts";
import { ApiError } from "../utils/api-error.ts";
import { ApiResponse } from "../utils/api-response.ts";
import { asyncHandler } from "../utils/async-handler.ts"


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

    return res.status(201).json(new ApiResponse(200, { user: createdUser }, "User registered successfull"))
})

export {
    signup
}