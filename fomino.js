require("dotenv").config();
const express = require("express");
const http = require("http");

const db = require("./models");
const cors = require("cors");
const error = require("./middlewares/error");
const { user } = require("./models");
const {  initializeWebSocket } = require("./socket");
// Importing routes
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const driverRouter = require("./routes/driver");
const restaurantRouter = require("./routes/restaurant");
const frontSite = require("./routes/frontsite");
const retailerRoute = require("./routes/retailer");
const adyenRoute = require("./routes/adyen");
const notification = require('./helper/ApiResponse')


const app = express();
const server = http.createServer(app); // Create an HTTP server
// const wss = new WebSocket.Server({ server });

// Middleware which tells the server the format to send data
app.use(express.json());
app.use(cors());

// routes
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/driver", driverRouter);
app.use("/restaurant", restaurantRouter);
app.use("/frontsite", frontSite);
app.use("/retailer", retailerRoute);
app.use("/adyen", adyenRoute);

// Throwing unattended error
app.use(error);
const wss = initializeWebSocket(server);
// To make the folder Public
app.use("/Public", express.static("./Public"));
wss.on("connection", async (ws) => {
  console.log(`User connected: ${ws._socket.remoteAddres}`);
  ws.on("message", async (message) => {
    try {
      const newMessage = JSON.parse(message);
      console.log(ws._socket.remoteAddress);
      await user.update(
        { ip: ws._socket.remoteAddress }, // Data to be updated
        { where: { id: newMessage.userId } } // Condition to find the user by their ID
      );     
    } catch (error) {
      console.log({ success: false, error: error.message });
    }
  });
  ws.on("close", () => {
    console.log("Disconnected from user");
  });
});

db.sequelize.sync().then(() => {
  server.listen(process.env.PORT, () => {
    console.log(`Starting the server at port ${process.env.PORT} ...`);
  });
});
