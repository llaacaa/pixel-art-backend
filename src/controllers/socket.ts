import { Server } from "socket.io";
import http from "http";
import jsonWebToken from "../utils/jsonWebToken";
import { JwtPayload } from "jsonwebtoken";
import { BasePictureDto, PictureDto } from "../types/pictureTypes";

type TServerInstance = http.Server;

let io: Server | null = null;

interface ConnectedUsers {
  [userId: string]: string;
}

type Picture = {
  pictureId: string;
  pictureData: string[][];
};

const listOfActiveDrawings: Picture[] = [];

const connectedUsers: ConnectedUsers = {};

export const getSocketIdFromUserId = (userId: string) => {
  return connectedUsers[userId];
};

function startSocket(server: TServerInstance): Server {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      const token = socket.handshake.query.token as string;
      const username = socket.handshake.query.username as string;
      const pictureId = socket.handshake.query.pictureId as string;
      const pictureData: unknown = socket.handshake.query.pictureData;

      if (token && username) {
        const userData = jsonWebToken.verifyToken(token) as JwtPayload;
        if (userData) {
          connectedUsers[userData.userId] = socket.id; 
          console.log(`User ${username} connected with socket ID ${socket.id}`);

          if (pictureId && pictureData) {
            let picture = listOfActiveDrawings.find(
              (p) => p.pictureId === pictureId
            );

            if (!picture) {
              const newPicture: Picture = {
                pictureId,
                pictureData: pictureData as string[][],
              };
              listOfActiveDrawings.push(newPicture);
              console.log(`Added new picture ${pictureId} to active drawings`);
            } else {
              console.log(`Picture ${pictureId} is already active`);
            }

            socket.join(pictureId);
            console.log(`User ${username} joined room ${pictureId}`);

            socket.on(`${pictureId}`, (update) => {
              console.log(`Received update for picture ${pictureId}:`, update);

              const pictureToUpdate = listOfActiveDrawings.find(
                (p) => p.pictureId === pictureId
              );
              if (pictureToUpdate) {
                pictureToUpdate.pictureData = update.pictureData;
              }

              io!.to(pictureId).emit(`${pictureId}`, update.pictureData);
            });

            socket.on("cursorMove", (cursorData) => {
              console.log("🚀 ~ socket.on ~ cursorData:", cursorData)
              io!.to(pictureId).emit("cursorMove", cursorData);
            });


            socket.on("remove-pointer", (pointer) => {
              io!.to(pictureId).emit("remove-pointer", pointer);
            })
          }
        } else {
          console.log("Invalid token");
          socket.disconnect(); 
          return;
        }
      } else {
        console.log("No token provided");
        socket.disconnect(); 
        return;
      }

      socket.on("disconnect", () => {
        const userId = Object.keys(connectedUsers).find(
          (key) => connectedUsers[key] === socket.id
        );
        if (userId) {
          delete connectedUsers[userId];
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  }
  return io;
}

export default startSocket;

export function getSocketIO(): Server | null {
  return io;
}
