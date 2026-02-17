/**
 * @file API route aggregator.
 * @throws {never} Module initialization does not throw.
 */
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import userRoutes from "./userRoutes.js";
import taskRoutes from "./taskRoutes.js";
import taskActivityRoutes from "./taskActivityRoutes.js";
import taskCommentRoutes from "./taskCommentRoutes.js";
import materialRoutes from "./materialRoutes.js";
import vendorRoutes from "./vendorRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import attachmentRoutes from "./attachmentRoutes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API root is available",
  });
});

router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/departments", departmentRoutes);
router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/tasks", taskActivityRoutes);
router.use("/tasks", taskCommentRoutes);
router.use("/materials", materialRoutes);
router.use("/vendors", vendorRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/attachments", attachmentRoutes);

export default router;
