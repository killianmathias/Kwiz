// src/lib/socket.ts
import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Un joueur s'est connecté :", socket.id);

    socket.on("joinGame", (gameId: number) => {
      socket.join(`game-${gameId}`);
      console.log(`➡️ Socket ${socket.id} a rejoint game-${gameId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Un joueur s'est déconnecté :", socket.id);
    });
  });
};

export const getIO = () => io;