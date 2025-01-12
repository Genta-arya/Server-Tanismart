
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Routes } from "./src/Routes/AuthRoute.js";
import { RoutesProduk } from "./src/Routes/ProdukRoute.js";
import path from "path";
import { RoutesTransaksi } from "./src/Routes/TransaksiRoute.js";

const app = express();
const PORT = 3005;
const httpServer = createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use('/images', express.static(path.join(path.resolve(), 'public/images')));
app.use('/nota', express.static(path.join(path.resolve(), 'public/nota')));
app.use("/api/auth", Routes);
app.use("/api/produk", RoutesProduk);
app.use("/api/transaksi", RoutesTransaksi);


httpServer.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
  