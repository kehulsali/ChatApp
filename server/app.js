const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});

require("./db/conn");
const Users = require("./models/Users");
const Conversation = require("./models/Conversations");
const Messages = require("./models/Messages");

const port = process.env.PORT || 8000;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//socket.io
let users = [];
io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, conversationId, message, receiverId }) => {
      const receiver = users.find((user) => user.userId === receiverId);
      const sender = users.find((user) => user.userId === senderId);
      const user = await Users.findById(senderId);
      if (receiver) {
        io.to(receiver.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            receiverId,
            user: { id: user._id, fullname: user.fullname, email: user.email },
          });
      }
      // else {
      //   io.to(sender.socketId).emit("getMessage", {
      //     senderId,
      //     message,
      //     conversationId,
      //     receiverId,
      //     user: { id: user._id, fullname: user.fullname, email: user.email },
      //   });
      // }
    }
  );

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      res.status(400).send("Please fill all require fields");
    } else {
      const isAlreadyExixts = await Users.findOne({ email });

      if (isAlreadyExixts) {
        return res.status(400).send("User already exists.");
      } else {
        const newUser = new Users({
          fullname,
          email,
        });
        bcrypt.hash(password, 10, async (err, hashedPassword) => {
          newUser.set("password", hashedPassword);
          await newUser.save();
          next();
        });

        return res.status(200).send("User register succesfully");
      }
    }
  } catch (e) {
    console.log("Error", e);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("Please fill all require fields");
    } else {
      const user = await Users.findOne({ email });
      if (!user) {
        res.status(400).send("User email or password is incorrect");
      } else {
        const validateUser = await bcrypt.compare(password, user.password);
        if (!validateUser) {
          res.status(400).send("User email or password is incorrect");
        } else {
          const payload = {
            userId: user._id,
            email: user.email,
          };
          const JWT_SECRETKEY =
            process.env.JWT_SECRETKEY || "THIS_IS_A_JWT_SECRET_KEY";
          jwt.sign(
            payload,
            JWT_SECRETKEY,
            { expiresIn: 84600 },
            async (err, token) => {
              await Users.updateOne(
                { _id: user._id },
                {
                  $set: { token },
                }
              );
              user.save();
              return res.status(200).json({
                user: {
                  id: user._id,
                  email: user.email,
                  fullname: user.fullname,
                },
                token: token,
              });
            }
          );
        }
      }
    }
  } catch (e) {
    console.log("Error", e);
  }
});

app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation created succesfully");
  } catch (e) {
    console.log("Error :", e);
  }
});

app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversation = await Conversation.find({
      members: { $in: [userId] },
    });
    const conversationUserData = Promise.all(
      conversation.map(async (conv) => {
        const receiverId = await conv.members.find(
          (member) => member !== userId
        );
        const user = await Users.findById(receiverId);
        return {
          user: {
            receiverId: user._id,
            email: user.email,
            fullname: user.fullname,
          },
          conversationId: conv._id,
        };
      })
    );
    res.status(200).json(await conversationUserData);
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/message", async (req, res) => {
  try {
    const { senderId, conversationId, message, receiverId = "" } = req.body;
    if (!senderId || !message) return res.status(400).send("Missing fields");
    if (conversationId === "new" && receiverId) {
      const newConversation = new Conversation({
        members: [senderId, receiverId],
      });
      await newConversation.save();
      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        message,
      });
      await newMessage.save();
      return res.status(200).json("Message sent successfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("Please fill all required fields");
    }
    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send("Message sent succesfully");
  } catch (e) {
    console.log("Error:", e);
  }
});

app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId });
      const messageUserData = Promise.all(
        messages.map(async (message) => {
          const user = await Users.findOne({ _id: message.senderId });
          return {
            user: { id: user._id, email: user.email, fullname: user.fullname },
            message: message.message,
          };
        })
      );

      res.status(200).json(await messageUserData);
    };
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversationId = await Conversation.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });
      if (checkConversationId.length > 0) {
        checkMessages(checkConversationId[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessages(conversationId);
    }
  } catch (e) {
    console.log("Error:", e);
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne: userId } });
    const userData = Promise.all(
      users.map(async (use) => {
        return {
          user: {
            email: use.email,
            fullname: use.fullname,
            receiverId: use._id,
          },
        };
      })
    );
    res.status(200).send(await userData);
  } catch (e) {
    console.log("Error:", e);
  }
});

app.get("/dev", (req, res) => {
  res.send('dex');
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
