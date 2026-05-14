const express = require("express");
const cors = require("cors");
const dbConnect = require("./database/dbConnect")
const { requireAuth } = require('./middleware/auth');
const usersRoute = require('./routes/usersRoute');
const clinicsRoute = require('./routes/clinicsRoute');
const schedulesRoute = require('./routes/schedulesRoute');
const appointmentsRoute = require("./routes/appointmentsRoute");
const queuesRoute = require("./routes/queuesRoute");
const specialitiesRoute = require("./routes/specialitiesRoute");
const consultsRoute = require("./routes/consultsRoute"); 

dbConnect();

const server = express();

server.use(cors({
    origin: process.env.CLIENT_URL
}));

server.use(express.json());

// protect all '/api' routes
server.use("/api", requireAuth);

server.use(usersRoute);
server.use(clinicsRoute);
server.use(schedulesRoute);
server.use(appointmentsRoute);
server.use(queuesRoute);
server.use(specialitiesRoute);
server.use(consultsRoute); 

// hello mr api! :D
server.get("/hello", (req, res) => {
    res.json({message : "Hello world!"});
});

/* istanbul ignore next */ //ignores this block in code coverage
if (require.main === module) {
    const port = process.env.PORT || 5000;
    const listener = server.listen(port, () => {
        console.log(`Running on port ${port}`);
    });
}

module.exports = server;