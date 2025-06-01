import { Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

export const getTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const test = "Testing from /test";
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving test" });
  }
};
