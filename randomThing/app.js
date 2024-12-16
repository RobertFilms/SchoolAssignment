const customStuff = require('./custom');

const express = require('express');
const app = express();
const PORT = 3000;

app.use( (req, res, next) => {
    console.log(`This is the last middleware function`);
    next();
});

app.use( (req, res, next) => {
    console.log(`time: ${Date.now()}`);
    next();
});

const otherMiddleware = (req, res, next) => {
    console.log(`This is another middleware function`);
    next();
}

const otherMiddleware2 = (req, res, next) => {
    console.log(`This is another middleware function 2`);
    next();
}

app.get('/', otherMiddleware, otherMiddleware2, customStuff.callBackReq);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});