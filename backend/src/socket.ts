import { Server } from "socket.io";
import { Server as httpServer } from "http";
import jwt from "jsonwebtoken";
import { PrismaClient } from "./generated/prisma";
import { startRound } from "./utils/gameEngine";

const prisma = new PrismaClient();

let io: Server;

interface AuthPayload {
  userId: string;
}

export const initSocket = (server: httpServer) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Middleware d’authentification Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Token manquant"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as any).userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Token invalide"));
    }
  });

  io.on("connection", (socket) => {
    const userId = parseInt((socket as any).userId);
    console.log(`Utilisateur connecté : ${socket.id} (userId: ${userId})`);

    socket.on("join_game", async ({ gameId }) => {
      const roomName = `game_${gameId}`;

      try {
        const player = await prisma.gamePlayer.findFirst({
          where: { gameId, userId },
        });

        if (!player) {
          socket.emit("error", {
            message: "Tu ne fais pas partie de cette partie",
          });
          return;
        }

        socket.join(roomName);
        console.log(`Joueur ${userId} a rejoint la room ${roomName}`);

        socket.to(roomName).emit("player_joined", { userId });

        const players = await prisma.gamePlayer.findMany({
          where: { gameId },
        });

        const game = await prisma.game.findUnique({ where: { id: gameId } });

        if (players.length === 2 && game?.state === "WAITING") {
          console.log(
            `2 joueurs dans ${roomName}, démarrage automatique de la partie`
          );
        }

        socket.on("submit_answer", async ({ gameId, round, answerIndex }) => {
          const userId = parseInt((socket as any).userId);

          try {
            const game = await prisma.game.findUnique({
              where: { id: gameId },
            });

            if (!game || game.state !== "STARTED" || game.round !== round) {
              socket.emit("error", {
                message: "Partie invalide ou round incorrect.",
              });
              return;
            }

            // Trouver la GameQuestion du round
            const gameQuestion = await prisma.gameQuestion.findFirst({
              where: { gameId, round },
            });

            if (!gameQuestion) {
              socket.emit("error", {
                message: "Aucune question trouvée pour ce round.",
              });
              return;
            }

            // Vérifie si l'utilisateur est bien dans cette partie
            const gamePlayer = await prisma.gamePlayer.findFirst({
              where: { gameId, userId },
            });

            if (!gamePlayer) {
              socket.emit("error", {
                message: "Tu ne fais pas partie de cette partie.",
              });
              return;
            }

            // Vérifie s'il a déjà répondu
            const existing = await prisma.answer.findFirst({
              where: {
                userId,
                gameQuestionId: gameQuestion.id,
              },
            });

            if (existing) {
              socket.emit("error", {
                message: "Tu as déjà répondu à cette question.",
              });
              return;
            }

            // Enregistre la réponse
            await prisma.answer.create({
              data: {
                gameQuestionId: gameQuestion.id,
                userId,
                index: answerIndex,
              },
            });

            socket.emit("answer_received", { round });
          } catch (err) {
            console.error("Erreur lors de submit_answer:", err);
            socket.emit("error", { message: "Erreur serveur." });
          }
        });
      } catch (err) {
        console.error("Erreur join_game:", err);
        socket.emit("error", {
          message: "Erreur lors de la tentative de rejoindre la partie",
        });
      }
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) throw new Error("Socket.io non initialisé !");
  return io;
};
