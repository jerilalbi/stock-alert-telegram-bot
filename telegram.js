const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const eventEmitter = require('./eventEmitter');

const bot = new TelegramBot(process.env.TOKEN,{polling: true})
let chatId;

function startMessage(){
    try{
        bot.on("message", (msg) =>{
            switch(msg.text){
                case '/start':
                sendMessage({id: msg.from.id,message: "Hello, \nI will send you marubozu stocks in each minute from 9:00 AM to 3PM in Monday to Friday"});
                break;
                default: sendMessage({id: msg.from.id, message: "Dont't worry I will send you stock recommendation"})
            }
            chatId = msg.from.id;
            eventEmitter.emit("chatID",chatId);
        })
    }catch(error){
        console.error(error);
    }
    
}


function sendMessage({id,message}){
    try{
        bot.sendMessage(id,message);
    }catch(error){
        console.error(error);
    }
}

module.exports = {sendMessage, startMessage}