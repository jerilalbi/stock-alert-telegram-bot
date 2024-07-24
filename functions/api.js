
const express = require('express');
const serverless = require('serverless-http');

require('dotenv').config();

const app = express();
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`Bot is under Maintenance ${process.env.ENDDATE}`);
});

app.use('/.netlify/functions/api', router);


module.exports.handler = serverless(app);

