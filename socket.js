const WebSocket = require("ws");
const { user } = require("./models");
const { v4: uuidv4 } = require('uuid');
let wssInstance;
// const initializeWebSocket = (server) => {
//   const wss = new WebSocket.Server({ server });
//   wssInstance = wss;
//   wss.on("connection", async (ws) => {
//     console.log(`User connected: ${ws._socket.remoteAddress}`);

//     ws.on("message", async (newMessage) => {
//       try {

//         let message = JSON.parse(newMessage);
//         console.log("***********************************");
//         console.log(message);
//         if (message.type == "connected") {
//           await user.update(
//             { ip: ws._socket.remoteAddress },
//             { where: { id: message.userId } }
//           );
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     });

//     ws.on("close", () => {
//       console.log("Disconnected from user");
//     });
//   });

//   return wss;
// };
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  wssInstance = wss;

  wss.on("connection", async (ws) => {
    const clientId = uuidv4(); // Generate unique ID for client
    console.log(
      `User connected with ID ${clientId}: ${ws._socket.remoteAddress}`
    );

    ws.on("message", async (newMessage) => {
      try {
        let message = JSON.parse(newMessage);
        console.log("***********************************");
        console.log(message);
        if (message.type == "connected") {
          // Update user with the unique client ID and IP address
          await user.update(
            { 
              ip: clientId,
            },
            { where: { id: message.userId } }
          );
        }
      } catch (error) {
        console.log(error);
      }
    });

    ws.on("close", () => {
      console.log(`Client ${clientId} disconnected`);
    });
  });

  return wss;
};
const sendEvent = (ip, eventData) => {
  try {
    console.log("event calledddddddddddddddddddddd");
    wssInstance.clients.forEach((client) => {
      console.log(`client wla hai yar : ${client._socket.remoteAddress}`);
      console.log(`ye ip wala hia bsdk ${ip}`);
      if (client._socket.remoteAddress == ip) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(eventData));
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { initializeWebSocket, sendEvent };
