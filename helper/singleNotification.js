
module.exports = function ( deviceToken,title, body,data) {
    let FCM = require("fcm-node");
    let serverKey = process.env.FIREBASE_SERVER_KEY1;
   
    let fcm = new FCM(serverKey);
    let message = {
      to: deviceToken,
      notification: {
        title: title,
        body: body,
       
      },
       data:data
    };  
    fcm.send(message, function (error, result) {
      if (error) {
        console.log(error);
      }
      console.log(result);
    });
  };
  