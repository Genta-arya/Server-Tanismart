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

// Middleware untuk membersihkan encoding di URL
app.use('/nota', (req, res, next) => {
  // Log original URL
  console.log('Original URL:', req.url);

  // Decode URL dan hilangkan karakter %7D yang merujuk pada '}' jika ada
  const decodedUrl = decodeURIComponent(req.url);
  console.log('Decoded URL:', decodedUrl); // URL setelah decode

  // Menghapus karakter '}' yang tidak perlu (jika ada)
  const cleanedUrl = decodedUrl.replace('}', ''); 
  console.log('Cleaned URL:', cleanedUrl); // URL yang dibersihkan

  // Update req.url untuk meneruskan URL yang sudah dibersihkan
  req.url = cleanedUrl;
  next();
}, express.static(path.join(path.resolve(), 'public/nota')));

app.use("/images", express.static(path.join(path.resolve(), "public/images")));

app.use("/api/auth", Routes);
app.use("/api/produk", RoutesProduk);
app.use("/api/transaksi", RoutesTransaksi);

httpServer.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
