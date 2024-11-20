import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", //TODO: Change this in production
    methods: ["GET", "POST"],
  },
});

const PORT = 4000;

app.get("/", (req: Request, res: Response) => {
  res.send("Servidor WebSocket para Outbuild");
});

let tasks: Array<{ id: string; title: string; column: string }> = [];
let connectedUsers: Array<{ id: string; name?: string }> = [];

io.on("connection", (socket) => {
  console.log(`User logged in: ${socket.id}`);
  connectedUsers.push({ id: socket.id });
  socket.emit("users:update", connectedUsers);

  socket.emit("tasks:update", tasks);

  socket.on("tasks:update", (updatedTasks) => {
    tasks = updatedTasks;

    socket.broadcast.emit("tasks:update", tasks);
  });

  socket.on("task:interaction", ({ taskId, action }) => {
    socket.broadcast.emit("task:interaction", {
      taskId,
      userId: socket.id,
      action,
    });
  });

  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
    socket.broadcast.emit("users:update", connectedUsers);
    console.log(`User logged out: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on http://localhost:${PORT}`);
});
