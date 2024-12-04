const express = require('express');
const path = require('path');
const http = require('http');
const ejs = require('ejs');
const fs = require('fs');

const app = express();
const PORT = 3000;

//Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//app gets
app.get('/', (req, res) => {
    res.render('index');
});

ejs.renderFile('views/index.ejs', { online: false}, (err, ren) => {
    console.log(ren);
    ejs.renderFile('./views/index.ejs', { viewport: 'string' },
        (err, ren) => {
            console.log(ren);
            fs.writeFile('index.html', ren, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('File written successfully');
                }
            });
        });
});

//Start server
http.createServer(app).listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});