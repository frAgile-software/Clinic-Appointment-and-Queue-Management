const express = require("express");
const cors = require("cors");
const dbConnect = require("./database/dbConnect")
const registerRoute = require("../routes/register");
const userRoute = require("../routes/user");
const { requireAuth } = require('./middleware/auth');

dbConnect();

const server = express();

server.use(cors({
    origin: process.env.CLIENT_URL
}));

server.use(express.json());

//protect all api routes
server.get("/api", requireAuth);

server.use("/api/register", registerRoute);
server.use("/api/user", userRoute);

//example api implementation
server.get("/api/hello", (req, res) => {
    res.json({message : "Hello world!"});
});

const port = process.env.PORT || 5000;

// Capture the listener in a variable
const listener = server.listen(port, () => {
    console.log(`Running on port ${port}`);
});

module.exports = server;
module.exports.listener = listener;
