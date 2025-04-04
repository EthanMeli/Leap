import express from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import {createServer} from "http";

// routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import dateCardRoutes from "./routes/dateCardRoutes.js";

import { initializeSocket } from "./socket/socket.server.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

initializeSocket(httpServer);

app.use(express.json({ limit: '50mb' }));  // Increased limit for image uploads
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/date-cards", dateCardRoutes);

httpServer.listen(PORT, () => {
  console.log("Server started at port: " + PORT);
});