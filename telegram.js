const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TOKEN,{polling: true})

bot.on("message", (msg) =>{
    switch(msg.text){
        case '/start':
        sendMessage({id: msg.from.id,message: "Hello, \nI will send you marubozu stocks in each minute from 9:00 AM to 3PM in Monday to Friday"})
    }
    console.log(msg)
})

sendMessage();

function sendMessage({id,message}){
    bot.sendMessage(id,message);
}