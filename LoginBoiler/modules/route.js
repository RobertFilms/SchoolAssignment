const express = require('express');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const FBJS_URL = 'https://formbar.yorktechapps.com';
const THIS_URL = 'http://localhost:3000/fbLogin';

let db = new sqlite3.Database('data/userData.db', (err) => {
    if (err) {
        console.error('Database opening error: ', err.message);
    } else {
        console.log('Connected to the database.');
    }
});

//Routes
function isAuthed(req, res, next) {
    if (req.session.user) {
        next();
        return;
    }
    res.send('<script>alert("You must be logged in to access this page"); window.location.href = "/";</script>');
    return;
}

const index = (req, res) => {
    res.render('index', { username: req.session.user });
}
const fbLogin = (req, res) => {
    console.log('Token print');
    if (req.query.token) {
        let tokenData = jwt.decode(req.query.token);
        req.session.token = tokenData;
        req.session.user = tokenData.username;
        let username = req.session.user;
        let id = req.session.token.id;
        try {
            db.get('SELECT * FROM fbUsers WHERE fb_id = ?', [id], (err, row) => {
                if (err) {
                    console.error(err.message);
                } else {
                    if (row) {
                        console.log('update');
                        db.run('UPDATE fbUsers SET fb_name = ? WHERE fb_id = ?', [username, id], (err) => {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log('User updated');
                                res.redirect('/');
                            }
                        });
                    } else {
                        console.log('insert');
                        db.run('INSERT INTO fbUsers (fb_id, fb_name) VALUES (?, ?)', [id, username], (err) => {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log('User inserted');
                                res.redirect('/');
                            }
                        });
                    }
                }
            });
        } catch (err) {
            console.error('Database error: ', err);
        }
    } else {
        console.log('Token not defined');
        res.redirect(`${FBJS_URL}/oauth?redirectURL=${THIS_URL}`);
    }
};
const loginGet = (req, res) => {
    res.render('login');
};
const loginPost = (req, res) => {
    db.get(`SELECT * FROM users WHERE username = ?;`, req.body.username, (err, row) => {
        if (err) {
            res.send('<script>alert("An error occurred:\n' + err + '"); window.location.href = "/login";</script>');
        } else if (!row) {
            // Create a new salt for this user
            const SALT = crypto.randomBytes(16).toString('hex');
            // Use salt to 'hash' password
            crypto.pbkdf2(req.body.password, SALT, 1000, 64, 'sha512', (err, derivedKey) => {
                if (err) {
                    res.send('<script>alert("An error occurred:\n' + err + '"); window.location.href = "/login";</script>');
                } else {
                    const hashPassword = derivedKey.toString('hex');
                    db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?);', [req.body.username, hashPassword, SALT], (err) => {
                        if (err) {
                            res.send('<script>alert("An error occurred:\n' + err + '"); window.location.href = "/login";</script>');
                        } else {
                            res.send('<script>alert("New user created"); window.location.href = "/login";</script>');
                        }
                    });
                }
            });
        } else {
            crypto.pbkdf2(req.body.password, row.salt, 1000, 64, 'sha512', (err, derivedKey) => {
                if (err) {
                    res.send('<script>alert("An error occurred:\n' + err + '"); window.location.href = "/login";</script>');
                } else {
                    const hashPassword = derivedKey.toString('hex');
                    if (hashPassword === row.password) {
                        req.session.user = req.body.username;
                        res.redirect('/');
                    } else {
                        res.send('Invalid username or password');
                    }
                }
            });
        }
    });
};
const logout = (req, res) => {
    res.redirect('/login');
};
const chat = (req, res) => {
    res.render('chat', { username: req.session.user });
};

//JUST GIVE A FELLA A BREAK!
module.exports = {
    isAuthed,
    index,
    loginGet,
    loginPost,
    logout,
    chat,
    fbLogin
};