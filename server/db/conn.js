const mongoose = require("mongoose");

const url = `mongodb+srv://chat-app-admin:information54@cluster0.sgmpx6l.mongodb.net/ChatApp?retryWrites=true&w=majority`;

mongoose
  .connect(url)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error));

// User Schema
