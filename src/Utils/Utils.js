import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const handleUnlinkImage = (filename) => {
  const newImagePath = path.join(path.resolve(), "public/images", filename);
  fs.unlinkSync(newImagePath);
};

export const unlinkDeleteImage = (paths) => {
  const newImagePath = path.join(path.resolve(), "public/",  paths);
  fs.unlinkSync(newImagePath);
}
