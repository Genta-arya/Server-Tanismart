import express, { Router } from "express";
import { createTransaksi, getTransaksi } from "../Controller/TransaksiController.js";

export const RoutesTransaksi = express.Router();
RoutesTransaksi.post("/create", createTransaksi);
RoutesTransaksi.get("/list/:id", getTransaksi);











