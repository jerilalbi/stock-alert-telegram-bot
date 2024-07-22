const marubozuStocks = require('../marubozuStocks');
const telegram = require('../telegram')
const eventEmitter = require('../eventEmitter');
const express = require('express');
const serverless = require('serverless-http');
const moment = require('moment-timezone');

require('dotenv').config();

const app = express();
const router = express.Router();
const PORT = 3000;

router.get('/', (req, res) => {
    res.send('Stock bot is running..');
});

router.get('/data', (req, res) => {
    marubozuStocks.testData(res);
})

app.use('/.netlify/functions/api', router);


// app.listen(PORT, (error) => {
//     if (!error) {
//         console.log("Server running at " + PORT)
//     } else {
//         console.log("Error occurred, server can't start", error);
//     }
// }
// );

// app.get('/', (req, res) => {
//     res.status(200);
//     res.send("Stock alert bot running");
// });

// app.get('/data', (req, res) => {
//     res.status(200);
//     marubozuStocks.testData(res);
// })

telegram.initializeBot();

let chatdID;
const isStop = false;

telegram.startMessage();

console.log('Task scheduler is running...');

async function tasksheldule() {
    try {
        eventEmitter.on("chatID", (id) => {
            chatdID = id;
        })

        eventEmitter.on("isStop", (value) => {
            isStop = value;
            console.log("event stopped")
        })

        // await marubozuStocks.openBrowser();

        const marubozuStockData = await marubozuStocks.getDataFromChartink();

        if (marubozuStockData.bearishStockData.length !== 0 || marubozuStockData.bullishStockData.length !== 0) {
            if (typeof chatdID !== 'undefined' && !isStop) {
                console.log("stocks send");
                await telegram.sendMessage({ id: chatdID, message: marubozuStockData.bullishStockData + "\n" + marubozuStockData.bearishStockData });
                marubozuStockData.bullishStockData = "Bullish Marubozu Stocks \n -------------------------  \n";
                marubozuStockData.bearishStockData = "Bearish Marubozu Stocks \n -------------------------  \n";
            }
        }
        console.log(new Date().getMinutes())
    } catch (error) {
        console.error(error);
    }

}

(async function timeScheduler() {
    try {
        const now = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const date = new Date(now);
        const currentDay = date.getDay();
        const currentHour = date.getHours();
        const currentMinute = date.getMinutes();

        const isWeekDay = currentDay >= 1 && currentDay <= process.env.ENDDATE;
        const isWithInTime = (currentHour === 9 && currentMinute >= 15) || (currentHour > 9 && currentHour < process.env.ENDTIME) || (currentHour == process.env.ENDTIME && currentMinute <= process.env.ENDMIN);

        console.log(`${currentHour} : ${currentMinute}`);

        if (isWeekDay && isWithInTime) {
            tasksheldule();
        }

        setTimeout(timeScheduler, 60 * (1000 * process.env.RUNGAP))
    } catch (e) {
        console.error("Error in timeScheduler:", e);
        setTimeout(timeScheduler, 60 * (1000 * process.env.RUNGAP));
    }

})()

module.exports.handler = serverless(app);

