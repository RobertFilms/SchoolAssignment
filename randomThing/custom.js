const { name } = require("ejs");

function nsync() {
    for (var i = 0; i < 3; i++) {
        console.log(`bye`);
    }
}

const jingleheimer = (name) => {
    name = name + ' Jacob Jingleheimer Schmidt';
    console.log(name);
}

const callBackReq = (req, res) => {
    res.send(`The Government is watching you`);
}

module.exports = {
    nsync,
    jingleheimer,
    callBackReq
}