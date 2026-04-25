const express = require("express");
const cors = require("cors");
const dbConnect = require("./database/dbConnect")
const { requireAuth } = require('./middleware/auth');
const usersRoute = require('./routes/usersRoute');
const clinicsRoute = require('./routes/clinicsRoute');
const appointmentsRoute = require("./routes/appointmentsRoute");
const queuesRoute = require("./routes/queuesRoute");

dbConnect();

const server = express();

server.use(cors({
    origin: process.env.CLIENT_URL
}));

server.use(express.json());

// protect all '/api' routes
server.get("/api", requireAuth);

server.use(usersRoute);
server.use(clinicsRoute);
server.use(appointmentsRoute);
server.use(queuesRoute);

// hello mr api! :D
server.get("/hello", (req, res) => {
    res.json({message : "Hello world!"});
});

const port = process.env.PORT || 5000;
const listener = server.listen(port, () => {
    console.log(`Running on port ${port}`);
});

module.exports = server;
module.exports.listener = listener;
