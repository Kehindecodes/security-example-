const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');

require('dotenv').config();

const PORT = 3000;

const app = express();

app.use(helmet());

https.createServer({}, app).listen(PORT, () => {
	console.log(`Listening on port ${PORT}...`);
});
