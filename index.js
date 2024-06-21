const marubozuStocks = require('./marubozuStocks');
const telegram = require('./telegram')
const eventEmitter = require('./eventEmitter');
const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res)=>{
    res.status(200);
    res.send("Stock alert bot running");
});

app.listen(PORT, (error) =>{
    if(!error){
        console.log("Server running at "+ PORT)
    }else{
        console.log("Error occurred, server can't start", error);
    }
    }
);

let chatdID;
const isStop = false;

telegram.startMessage();

console.log('Task scheduler is running...');

async function tasksheldule(){
    try{
        eventEmitter.on("chatID",(id) =>{
            chatdID = id;
        })

        eventEmitter.on("isStop",(value) => {
            isStop = value;
            console.log("event stopped")
        })
    
        const marubozuStockData = await marubozuStocks();
    
        if(marubozuStockData.bearishStockData.length !== 0 || marubozuStockData.bullishStockData.length !== 0){
            if(typeof chatdID !== 'undefined' && !isStop){
                telegram.sendMessage({id: chatdID,message: marubozuStockData.bullishStockData+ "\n" + marubozuStockData.bearishStockData});
                marubozuStockData.bullishStockData = "Bullish Marubozu Stocks \n -------------------------  \n";
                marubozuStockData.bearishStockData = "Bearish Marubozu Stocks \n -------------------------  \n";
            }
        }
        console.log( new Date().getMinutes())
    }catch(error){
        console.error(error);
    }

}

(function timeScheduler(){
    const date = new Date();
    const currentDay = date.getDay();
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes(); 

    const isWeekDay = currentDay>= 1 && currentDay <= 5;
    const isWithInTime = (currentHour === 9 && currentMinute >= 15) || (currentHour > 9 && currentHour < 15) || (currentHour >= 15 && currentMinute <= 0);

    console.log(`${currentHour} : ${currentMinute}`);
    if(isWeekDay && isWithInTime){
        tasksheldule();
    }

    setTimeout(timeScheduler,60 * 1000)
})()

