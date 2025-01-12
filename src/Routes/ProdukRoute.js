import express from "express";
import { createProduk, deleteProduk, updateImageProduk } from "../Controller/ProdukController.js";
import { updateProduk } from "../Controller/ProdukController.js";
import { getProduk } from "../Controller/ProdukController.js";

export const RoutesProduk = express.Router();
RoutesProduk.post("/create", createProduk);
RoutesProduk.put("/update/:id", updateProduk);
RoutesProduk.put("/update/image/:id", updateImageProduk);
RoutesProduk.delete("/delete/:id", deleteProduk);
RoutesProduk.get("/list", getProduk);










