import express from "express";
import { register, login, logout, updateProfil } from "../Controller/AuthentikasiController.js";

export const Routes = express.Router();
Routes.post("/register", register);
Routes.post("/login", login);
Routes.post("/logout", logout);
Routes.put("/update/profil", updateProfil);	









