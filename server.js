const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
require('dotenv').config();
const passport = require('passport');
const cookieSession = require('cookie-session');
const { Strategy } = require('passport-google-oauth20');

const PORT = 3000;

const config = {
	CLIENT_ID: process.env.CLIENT_ID,
	CLIENT_SECRET: process.env.CLIENT_SECRET,
	COOKIE_KEY_1: process.env.COOKIE_KEY_1,
	COOKIE_KEY_2: process.env.COOKIE_KEY_2,
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

// save the session to the cookie
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// read the session from the cookie
passport.deserializeUser((id, done) => {
	// User.findById(id).then(user=>{
	// 	done(null, user)
	// })
	done(null, id);
});
const app = express();

app.use(helmet());
app.use(
	cookieSession({
		name: 'session',
		maxAge: 24 * 60 * 60 * 1000,
		// sign cookies with these keys
		keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
	}),
);
// set up passport session
app.use(passport.initialize());

// authenticate sessions that is sent to the server using the keys from the cookie session middleware and set req.user i.e it calls passport.deserialize()
app.use(passport.session());

function checkLoggedIn(req, res, next) {
	// check if user is authenticated
	const isLoggedIn = req.isAuthenticated() && req.user;

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
		session: true,
	}),
	(req, res) => {
		console.log('Google called us back');
	},
);
app.get('/auth/logout', (req, res) => {
	req.logout();
	return res.redirect('/');
});
app.get('/failure', (req, res) => {
	return res.send('failed to log in!');
});
app.get('/secret', checkLoggedIn, (req, res) => {
	return res.send('Your personal secret value is 42');
});
app.get('/', (req, res) => {
	// res.send('I dey work jare');
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
};

https.createServer(options, app).listen(PORT, () => {
	console.log(`Listening on port ${PORT}...`);
});
