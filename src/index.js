const express = require("express");
const path = require("path");

require("./db/mongoose");

const userRouter = require("./routers/userR");
const postRouter = require("./routers/postR");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(postRouter);
app.listen(port, () => {
	console.log("Server is up on port", port);
});
