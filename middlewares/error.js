module.exports = function (err, req, res, next) {
    res.json({
        'status': '0',
        'message': err.message,
        'data': {},
        'error': "Error",
    });
}