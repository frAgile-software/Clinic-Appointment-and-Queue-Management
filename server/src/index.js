const express = require("express");
const cors = require("cors");
const dbConnect = require("./database/dbConnect")

dbConnect();

const server = express();

server.use(cors({
    origin: process.env.CLIENT_URL
}));

server.use(express.json());

//example api implementation
server.get("/api/hello", (req, res) => {
    res.json({message : "Hello world!"});
});

const port = process.env.PORT || 5000;
const listener = server.listen(port, () => {
    console.log(`Running on port ${port}`);
});

module.exports = listener;
