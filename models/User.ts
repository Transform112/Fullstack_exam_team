import { Schema, model, models, type Model, type Types } from "mongoose";

// Platform user. Role is enforced on the server for every admin route.
export type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  avatar: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = (models.User as Model<UserLean>) || model("User", userSchema);

// Shape safe to send to clients: never includes passwordHash.
export function publicUser(u: UserLean) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role };
}
