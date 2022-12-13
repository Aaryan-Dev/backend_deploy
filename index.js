// express
const express = require("express");

// connection
const { connection } = require("./db");

// app
const app = express();
app.use(express.json());

// npms
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// models
const { TodoModle } = require("./modles/Todo.modle");
const { UserModle } = require("./modles/User.modle");

// Routes
app.get("/", (req, res) => {
  res.send(
    "This is backend Api for EMI calculator List" +
      "<br>" +
      "<br>" +
      "Sign Up ---> /signup" +
      "<br>" +
      "Login ---> /login"
      
  );
});

// AuthenticationMiddleWare

const AuthenticationMiddleWare = (req, res, next) => {
  const { token } = req.query;
  var decoded = jwt.verify(token, process.env.JWT_KEY);
  if (decoded) {
    // res.send(decoded);
    req.body.userId = decoded.userId;
    next();
  } else {
    res.send("LogIn again");
  }
};

// SignUp
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await UserModle.findOne({ email });
  if (exists) {
    res.send({ msg: "User Exists" });
  } else {
    bcrypt.hash(password, 6, async function (err, hash) {
      if (err) {
        res.send({ msg: "somthing went wrong" });
      } else {
        const new_user = new UserModle({
          email,
          password: hash,
          ip: req.socket.remoteAddress,
        });
        await new_user.save();
        res.send({ msg: "signed up successfully" });
      }
    });
  }
});

// LogIn
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userdata = await UserModle.findOne({ email });
  const hashed_password = userdata.password;
  const user_id = userdata._id;

  bcrypt.compare(password, hashed_password, function (err, result) {
    if (result) {
      var token = jwt.sign(
        { userId: user_id, email: email },
        process.env.JWT_KEY
      );

      res.send({ msg: `token ${token}` });
    } else {
      res.send({ msg: "wrong password or email" });
    }
  });
});

// addTodos
app.post("/addTodos", AuthenticationMiddleWare, async (req, res) => {
  const { taskname, status, tag, userId } = req.body;

  console.log(userId);

  const new_todo = new TodoModle({
    taskname,
    status,
    tag,
    userId: userId,
  });

  await new_todo.save();
  res.send({ msg: "Task added Susseccfully" });
});

// getTodos
app.get("/todos", AuthenticationMiddleWare, async (req, res) => {
  const { userId } = req.body;
  const todo_data = await TodoModle.find({ userId });

  res.send({ msg: todo_data });
});

// port
const port = process.env.PORT || 8080;

// listening
app.listen(port, async () => {
  try {
    await connection;
  } catch (err) {
    console.log(err);
  }
  console.log("Active");
});
