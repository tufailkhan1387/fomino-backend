module.exports = function CustomException(message, body) {
  //console.log(message);  
  const error = new Error(message);
  error.body = body;
  return error;
};