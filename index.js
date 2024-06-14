const marubozuStocks = require('./marubozuStocks');
const telegram = require('./telegram')
const eventEmitter = require('./eventEmitter');

let chatdID;

async function getdata(){
    const marubozuStockData = await marubozuStocks();
    console.log(marubozuStockData.bullishStockData);
}

telegram.startMessage();

console.log('Task scheduler is running...');

function tasksheldule(){
    eventEmitter.on("chatID",(id) =>{
        chatdID = id;
    })
    if(typeof chatdID !== 'undefined'){
        telegram.sendMessage({id: chatdID,message: new Date().getMinutes()});
    }
    console.log("Time = "+ new Date().getMinutes())
}

(function timeScheduler(){
    const date = new Date();
    const currentDay = date.getDay();
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes(); 

    const isWeekDay = currentDay>= 1 && currentDay <= 5;
    const isWithInTime = (currentHour === 9 && currentMinute >= 15) || (currentHour > 9 && currentHour < 15) || (currentHour >= 15 && currentMinute <= 15);

    if(isWeekDay && isWithInTime){
        tasksheldule();
    }

    setTimeout(timeScheduler,60 * 1000)
})()

