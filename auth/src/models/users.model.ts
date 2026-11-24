import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Properties required to create a new user
interface UserAttrs {
    email: string;
    password: string;
}



const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        statics: {
            // Type-safe way to create a user: User.build({ email, password })
            build(attrs: UserAttrs) {
                return new this(attrs);
            },
        },
        methods: {
            async isPasswordCorrect(password: string): Promise<boolean> {
                return bcrypt.compare(password, this.password);
            },
            generateAccessToken() {
                const secret = process.env.ACCESS_TOKEN_SECRET;
                if (!secret) {
                    throw new Error('ACCESS_TOKEN_SECRET is not configured');
                }

                return jwt.sign(
                    {
                        id: this._id,
                        email: this.email,
                    },
                    secret,
                );
            },
        },
        toJSON: {
            // Shape the JSON returned to clients: hide password and Mongo internals
            transform(_doc, ret: Record<string, any>) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

userSchema.pre("save", async function () {
    if(!this.isModified("password")){
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
})

// Types inferred from the schema (single source of truth)
export type IUser = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<IUser>;

export const User = model('User', userSchema);
 