import express, { Router } from "express";
import { createTransaksi, getTransaksi, getAllTransaksi, TransaksiExcel } from "../Controller/TransaksiController.js";

export const RoutesTransaksi = express.Router();
RoutesTransaksi.post("/create", createTransaksi);
RoutesTransaksi.get("/list/:id", getTransaksi);
RoutesTransaksi.get("/list", getAllTransaksi);
RoutesTransaksi.get("/report" , TransaksiExcel)










