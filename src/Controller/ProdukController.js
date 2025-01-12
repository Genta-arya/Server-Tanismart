import multer from "multer";
import { uploadImage } from "../Config/Multer.js";
import prisma from "../Config/Prisma.js";
import path from "path";
import fs from "fs";
import { handleUnlinkImage, unlinkDeleteImage } from "../Utils/Utils.js";
export const createProduk = async (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error(err);
      return res
        .status(500)
        .json({ message: " Type error ( form-data : image )" });
    } else if (err) {
      return res.status(500).json({ message: err.message });
    }

    const { nama, harga, desc, stok } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null;

    if (!nama || !harga || !desc || !stok || !image) {
      return res
        .status(400)
        .json({ message: "Semua field wajib diisi dan gambar harus ada." });
    }

    try {
      const newProduk = await prisma.produk.create({
        data: {
          nama: nama,
          harga: parseFloat(harga),
          desc: desc,
          stok: parseInt(stok),
          images: {
            create: {
              url: image,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Produk berhasil dibuat",
        produk: newProduk,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  });
};

export const updateProduk = async (req, res) => {
  const { id } = req.params;
  const { nama, harga, desc, stok } = req.body;

  if (!id || !nama || !harga || !desc || !stok) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }
  const existsProduk = await prisma.produk.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!existsProduk) {
    return res.status(404).json({ message: "Produk tidak ditemukan" });
  }

  try {
    const updatedProduk = await prisma.produk.update({
      where: {
        id: parseInt(id),
      },
      data: {
        nama: nama,
        harga: parseFloat(harga),
        desc: desc,
        stok: parseInt(stok),
      },
    });

    return res.status(200).json({
      message: "Produk berhasil diperbarui",
      produk: updatedProduk,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

export const updateImageProduk = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID produk harus diisi." });
  }

  uploadImage(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "Gagal mengupload gambar." });
    } else if (err) {
      return res.status(500).json({ message: err.message });
    }

    const imageUrl = req.file ? `/images/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: "Gambar harus diupload." });
    }

    try {
      const produk = await prisma.produk.findFirst({
        where: { id: parseInt(id) },
        select: {
          images: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!produk) {
        return res.status(404).json({ message: "Produk tidak ditemukan." });
      }

      const updatedProduk = await prisma.image.update({
        where: { id: produk.images[0].id },
        data: {
          url: imageUrl,
        },
      });

      return res.status(200).json({
        message: "Gambar produk berhasil diperbarui",
        produk: updatedProduk,
      });
    } catch (error) {
      console.error(error);
      handleUnlinkImage(req.file.filename);

      return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  });
};

export const deleteProduk = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID produk harus diisi." });
  }

  try {
    const produk = await prisma.produk.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true,
      },
    });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan." });
    }

    await prisma.produk.delete({
      where: { id: parseInt(id) },
    });

    const images = await prisma.image.findMany({
      where: { id_produk: parseInt(id) },
    });

    for (const image of produk.images) {
      unlinkDeleteImage(image.url);
    }

    return res.status(200).json({ message: "Produk berhasil dihapus." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};


export const getProduk = async (req, res) => {
  try {
    const produk = await prisma.produk.findMany({
      include: {
        images: {
          select:{
            url: true
          }
        },
      },
    });
    return res.status(200).json({ produk: produk });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};