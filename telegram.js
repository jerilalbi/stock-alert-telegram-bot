const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const eventEmitter = require('./eventEmitter');

const bot = new TelegramBot(process.env.TOKEN,{polling: true})
let chatId;
let isStop;

function startMessage(){
    try{
        bot.on("message", (msg) =>{
            switch(msg.text){
                case '/start':
                    sendMessage({id: msg.from.id,message: "Created alert 🚨 for marubozu stocks in each minute from 9:00 AM to 3PM on Monday to Friday"});
                    break;
                case '/stop':
                    stopMessage(msg.from.id);
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

function startWebhook(url){
    bot.setWebHook(url);
}

function stopWebhook(){
    bot.deleteWebHook().then(()=> {
        bot.startPolling();
    })
}

function getWebhookdetails(){
    bot.getWebHookInfo().then((info) => {
        console.log(info);
    });
}

function errorHandingPollingError(){
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error);
    
        if (error.code === 'ETELEGRAM' && error.response.body.error_code === 409) {
            console.log('Conflict detected, restarting polling...');
            bot.stopPolling().then(() => {
                bot.startPolling();
            }).catch(err => {
                console.error('Error restarting polling:', err);
            });
        }
    });
}

function stopMessage(id){
    sendMessage({id: id,message: "Alert closed for stock recommendation"});
    isStop = true;
    eventEmitter.emit("isStop",isStop);
    // bot.stopPolling().then(() => console.log("polling stopped")).catch((error) => console.error(error))
}

module.exports = {sendMessage, startMessage, startWebhook, stopWebhook, getWebhookdetails, errorHandingPollingError}