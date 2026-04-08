const express = require("express");
const cors = require("cors");

const server = express();

server.use(cors());
server.use(express.json());

//example api implementation
server.get("/api/hello", (req, res) => {
    res.json({message : "Hello world!"});
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Running on port ${port}`);
});