import prisma from "../Config/Prisma.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const createTransaksi = async (req, res) => {
  const { id_user, id_produk, jumlah, alamat } = req.body;

  const parseIntId_produk = parseInt(id_produk);

  if (!id_user || !id_produk || !jumlah || !alamat) {
    return res.status(400).json({
      message: "ID pengguna, ID produk, jumlah, dan alamat harus diisi.",
    });
  }

  try {
    const produk = await prisma.produk.findUnique({
      where: { id: parseIntId_produk },
    });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan." });
    }

    if (produk.stok < jumlah) {
      return res.status(400).json({ message: "Stok produk tidak cukup." });
    }

    const total = produk.harga * jumlah + produk.ongkir;

    const transaksi = await prisma.transaksi.create({
      data: {
        id_user: id_user,
        id_produk: parseIntId_produk,
        jumlah: jumlah,
        alamat: alamat,
        total: total,
        status: "sukses",
      },
    });

    await prisma.produk.update({
      where: { id: parseIntId_produk },
      data: {
        stok: produk.stok - jumlah,
      },
    });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const filePath = path.join(
      path.resolve(),
      `public/nota/nota_${transaksi.id}.pdf`
    );

    doc.pipe(fs.createWriteStream(filePath));

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Tanismart", { align: "left" });
    doc
      .fontSize(14)
      .font("Helvetica")
      .text("Nota Transaksi", { align: "left" });
    doc.moveDown(1);

    doc.fontSize(12).text(`No Transaksi: # ${transaksi.id}`);
    doc.text(`Nama Produk: ${produk.nama}`);
    doc.text(`Jumlah: ${jumlah}`);
    doc.text(`Alamat: ${alamat}`);
    doc.text(
      `Total Harga: ${total.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      })}`
    );
    doc.text(`Status: ${transaksi.status}`);
    doc.text(`Tanggal: ${new Date().toLocaleString()}`);

    doc.moveDown().lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc
      .fontSize(10)
      .text("Terima kasih telah berbelanja di Tanismart!", { align: "center" });

    doc.end();

    await prisma.transaksi.update({
      where: { id: transaksi.id },
      data: {
        notaFile: `/nota/nota_${transaksi.id}.pdf`,
      },
    });

    res.status(201).json({
      message: "Transaksi berhasil dibuat, dan nota dikirimkan.",
      transaksi: transaksi,
      notaUrl: `/nota/nota_${transaksi.id}.pdf`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

export const getTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "ID pengguna harus diisi." });
  }

  const checkUser = await prisma.auth.findUnique({
    where: { id: id },
  });
  if (!checkUser) {
    return res.status(404).json({ message: "Pengguna tidak ditemukan." });
  }
  try {
    const transaksi = await prisma.transaksi.findMany({
      where: { id_user: id },
      select: {
        alamat: true,
        jumlah: true,
        total: true,
        status: true,
        notaFile: true,
        createdAt: true,
        id: true,
        produk: {
          include: {
            images: {
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan." });
    }
    return res.status(200).json({ data: transaksi });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};
