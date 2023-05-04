const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
require('dotenv').config();
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

const PORT = 3000;

const config = {
	CLIENT_ID: process.env.CLIENT_ID,
	CLIENT_SECRET: process.env.CLIENT_SECRET,
};

const AUTH_OPTIONS = {
	callbackURL: '/auth/google/callback',
	clientID: config.CLIENT_ID,
	clientSecret: config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken, profile, done) {
	console.log('Google profile', profile);
	done(null, profile);
}
passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

const app = express();

app.use(helmet());
app.use(passport.initialize());

function checkLoggedIn(req, res, next) {
	const isLoggedIn = true;

	if (!isLoggedIn) {
		return res.status(401).json({
			error: 'You must log in',
		});
	}
	next();
}
app.get(
	'/auth/google',
	passport.authenticate('google', {
		// data that we need from google
		scope: ['email'],
	}),
);
app.get(
	'/auth/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/failure',
		successRedirect: '/',
		session: false,
	}),
	(req, res) => {
		console.log('Google called us back');
	},
);
app.get('/auth/logout', (req, res) => {});
app.get('/failure', (req, res) => {
	return res.send('failed to log in!');
});
app.get('/secret', checkLoggedIn, (req, res) => {
	return res.send('Your personal secret value is 42');
});
app.get('/', (req, res) => {
	// res.send('I dey work jare');
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
	console.log('i dey work jare ');
});
const options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
};

https.createServer(options, app).listen(PORT, () => {
	console.log(`Listening on port ${PORT}...`);
});
