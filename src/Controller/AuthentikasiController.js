import prisma from "../Config/Prisma.js";
import { hashPassword } from "../Utils/Utils.js";
import bcrypt from "bcryptjs";
export const register = async (req, res) => {
  const { username, email, password, id } = req.body;
  console.log(req.body);

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Bad Request" });
  }

  try {
    if (id) {
      const checkUser = await prisma.auth.findUnique({
        where: {
          id: id,
        },
      });
      if (checkUser) {
        console.log("user already exists");
        await prisma.auth.update({
          where: {
            id: id,
          },
          data: {
            status: true,
          },
        })
        return res
          .status(201)
          .json({ message: "User already exists , not created" });
      } else {
        await prisma.auth.create({
          data: {
            id: id,
            nama: username,
            email: email,
            password: "",
            role: "user",
            status: true,
          },
        });
      }
      console.log("user created");
      return res.status(201).json({ message: "User created successfully" });
    } else {
      const emailExists = await prisma.auth.findFirst({
        where: {
          email: email,
        },
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(password);

      await prisma.auth.create({
        data: {
          nama: username,
          email: email,
          password: hashedPassword,
        },
      });
      return res.status(201).json({ message: "User created successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Bad Request" });
  }
  try {
    const user = await prisma.auth.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        nama: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      await prisma.auth.update({
        where: {
          id: user.id,
        },
        data: {
          status: true,
        },
      });
      const filterUsernotpassword = { ...user, password: "" };

      return res
        .status(200)
        .json({ message: "Login successful", data: filterUsernotpassword });
    }

    return res.status(401).json({ message: "Invalid password" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.auth.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }
    await prisma.auth.update({
      where: {
        id: user.id,
      },
      data: {
        status: false,
      },
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfil = async (req, res) => {
  const { id } = req.params;
  const { nama, email } = req.body;

  if (!id || !nama || !email) {
    return res.status(400).json({ message: "Bad Request" });
  }
  try {
    const user = await prisma.auth.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.auth.update({
      where: {
        id: parseInt(id),
      },
      data: {
        nama: nama,
        email: email,
      },
    });
    return res
      .status(200)
      .json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
