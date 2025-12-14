import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";

interface ChatClient {
  ws: WebSocket;
  userId: string;
}

const clients: Map<string, ChatClient> = new Map();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "auth":
            userId = message.userId;
            if (userId) {
              clients.set(userId, { ws, userId });
              ws.send(JSON.stringify({ type: "connected", userId }));
            }
            break;

          case "chat":
            if (!userId || !message.receiverId || !message.content) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
              return;
            }

            const chatMessage = await storage.sendChatMessage({
              senderId: userId,
              receiverId: message.receiverId,
              content: message.content,
            });

            ws.send(JSON.stringify({ type: "message_sent", message: chatMessage }));

            const recipientClient = clients.get(message.receiverId);
            if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
              recipientClient.ws.send(JSON.stringify({
                type: "new_message",
                message: chatMessage,
              }));
            }
            break;

          case "read":
            if (!userId || !message.senderId) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid read request" }));
              return;
            }

            await storage.markMessagesAsRead(message.senderId, userId);
            ws.send(JSON.stringify({ type: "messages_read", senderId: message.senderId }));
            break;

          case "typing":
            if (!userId || !message.receiverId) return;
            const typingRecipient = clients.get(message.receiverId);
            if (typingRecipient && typingRecipient.ws.readyState === WebSocket.OPEN) {
              typingRecipient.ws.send(JSON.stringify({
                type: "typing",
                senderId: userId,
                isTyping: message.isTyping,
              }));
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  return wss;
}
