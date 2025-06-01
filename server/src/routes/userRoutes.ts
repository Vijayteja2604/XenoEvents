import { Router } from "express";
import {
  editAccount,
  searchUsers,
  deleteAccount,
  uploadProfilePicture,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.patch("/edit", authMiddleware, editAccount);
router.get("/search", authMiddleware, searchUsers);
router.delete("/delete", authMiddleware, deleteAccount);
router.post("/upload-profile-picture", authMiddleware, uploadProfilePicture);

export default router;
