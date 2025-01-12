import express, { Request, Response } from "express";
import mongoConnect from "./utils/mongoConnect";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes";
import cors from "cors";
import pictureRouter from "./routes/pictureRoutes";
import startSocket from "./controllers/socket";
import { createServer } from "http";

const app = express();
const server = createServer(app);

startSocket(server);
dotenv.config();
mongoConnect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: "https://pixel-art-beta-one.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

//Routes
app.use("/auth", authRouter);
app.use("/pictures", pictureRouter);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
