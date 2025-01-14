import prisma from "../Config/Prisma.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import axios from 'axios';
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

export const getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await prisma.transaksi.findMany({
      include: {
        produk: {
          select: {
            nama: true,
            images: {
              select: {
                url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
    return res.status(200).json({ data: transaksi });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

export const TransaksiExcel = async (req, res) => {
  try {
    // Ambil data transaksi dari database
    const transaksi = await prisma.transaksi.findMany({
      include: {
        produk: {
          select: {
            nama: true,
            images: {
              select: {
                url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    // Buat workbook dan sheet baru menggunakan ExcelJS
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transaksi');

    // Menambahkan header pada Excel dengan style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4CAF50' } }, // Warna hijau
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      },
    };

    // Menambahkan header dengan format yang sudah disesuaikan
    sheet.addRow(['ID Transaksi', 'Nama Produk', 'Jumlah', 'Total', 'Nama User', 'Tanggal', 'Gambar Produk']);
    sheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Menambahkan data transaksi ke dalam Excel
    for (let transaksiData of transaksi) {
      const produk = transaksiData.produk;
      const user = transaksiData.user;

      // URL gambar dengan awalan
      const imageUrl = produk.images.length > 0
        ? `https://tanismart.apiservices.my.id${produk.images[0].url}`
        : 'No Image';

      // Menyisipkan gambar jika ada
      if (produk.images.length > 0) {
        // Mengunduh gambar dari URL
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgBuffer = response.data;

        // Menambahkan gambar ke dalam worksheet
        const imageId = workbook.addImage({
          buffer: imgBuffer,
          extension: 'png', // atau sesuaikan dengan jenis gambar (jpeg, png, etc)
        });

        // Menambahkan gambar pada cell tertentu (kolom G)
        sheet.addRow([
          transaksiData.id,
          produk.nama,
          transaksiData.jumlah,
          transaksiData.total,
          user.nama,
          transaksiData.createdAt,
          { text: 'Gambar Produk', hyperlink: imageUrl }, // Bisa menggunakan link atau placeholder teks
        ]);
        
        // Menyisipkan gambar ke dalam sel kolom ke-7 (Gambar Produk)
        sheet.getCell(`G${sheet.rowCount}`).value = 'Gambar Produk';
        sheet.getCell(`G${sheet.rowCount}`).style = {
          alignment: { vertical: 'middle', horizontal: 'center' }
        };
        sheet.addImage(imageId, `G${sheet.rowCount}:G${sheet.rowCount}`);
      } else {
        // Jika tidak ada gambar, hanya menampilkan teks
        sheet.addRow([
          transaksiData.id,
          produk.nama,
          transaksiData.jumlah,
          transaksiData.total,
          user.nama,
          transaksiData.createdAt,
          'No Image', // Teks placeholder untuk gambar
        ]);
      }
    }

    // Mengatur lebar kolom otomatis
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.value) {
          maxLength = Math.max(maxLength, cell.value.toString().length);
        }
      });
      column.width = maxLength + 2; // Menambahkan margin pada kolom
    });

    // Menyimpan file ke dalam folder public/laporan
    const folderPath = path.join(path.resolve(), 'public', 'laporan');
    
    // Cek apakah folder 'laporan' ada, jika tidak ada, buat foldernya
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, 'Laporan_Transaksi.xlsx');

    // Menyimpan file Excel ke file sistem
    await workbook.xlsx.writeFile(filePath);

    // Mengirimkan response kepada client
    res.status(200).json({
      message: 'File berhasil disimpan',
      fileUrl: `/laporan/Laporan_Transaksi.xlsx`, // Menyediakan URL untuk mengakses file
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};