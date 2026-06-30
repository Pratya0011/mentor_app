import express from "express";
import { retreveRouter } from "../Controller/chatController.js";

const router = express.Router();

router.post("/retreve", retreveRouter);

export default router;
