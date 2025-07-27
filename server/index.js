const express = require("express");
const http = require("http");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { Server } = require("socket.io");
const { UserModel } = require("./db");

const PORT = 3001;
const CORS_ORIGIN = "http://localhost:5173";
const JWT_SECRET = "your random secret key";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Authentication middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }
  try {
    const decodedData = jwt.verify(token, JWT_SECRET);
    req.userId = decodedData.id;
    req.username = decodedData.username;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Signup endpoint
app.post("/signup", async function(req, res) {
  const requiredBody = z.object({
    username: z.string().min(3).max(20),
    fullname: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(16)
  });

  const parsedDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parsedDataWithSuccess.success) {
    return res.status(400).json({
      message: "Invalid Format",
      errors: parsedDataWithSuccess.error.errors
    });
  }

  const { username, fullname, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await UserModel.create({
      username: username,
      fullname: fullname,
      email: email,
      password: hashedPassword
    });
    
    res.status(201).json({
      message: "You are signed up successfully"
    });
  } catch (e) {
    console.error("Signup error:", e);
    if (e.code === 11000) {
      // Duplicate key error
      const field = Object.keys(e.keyPattern)[0];
      return res.status(409).json({
        message: `User already exists with this ${field}`
      });
    }
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Login endpoint
app.post("/login", async function(req, res) {
  const requiredBody = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsedDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parsedDataWithSuccess.success) {
    return res.status(400).json({
      message: "Invalid email or password format"
    });
  }

  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(403).json({
        message: "Invalid credentials"
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (passwordMatched) {
      const token = jwt.sign({
        id: user._id.toString(),
        username: user.username
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token: token,
        username: user.username,
        fullname: user.fullname
      });
    } else {
      res.status(403).json({
        message: "Invalid credentials"
      });
    }
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Get user profile (protected route)
app.get("/profile", auth, async function(req, res) {
  try {
    const user = await UserModel.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      username: user.username,
      fullname: user.fullname,
      email: user.email
    });
  } catch (e) {
    console.error("Profile error:", e);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
