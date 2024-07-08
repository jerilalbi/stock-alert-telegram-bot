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

async function sendMessage({id,message}){
    try{
        await bot.sendMessage(id,message);
    }catch(error){
        console.error(error);
    }
}

async function initializeBot() {
    try {
        await bot.deleteWebHook();
        console.log('Webhook deleted successfully.');
        startPollingWithErrorHandling();
    } catch (err) {
        console.error('Error deleting webhook:', err);
        setTimeout(initializeBot, 5000);
    }
}

function startPollingWithErrorHandling() {
    bot.startPolling();

    bot.on('polling_error', async (error) => {

        if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
            console.log('Conflict detected, restarting polling...');
            try {
                await bot.stopPolling();
                setTimeout(startPollingWithErrorHandling, 1000);
            } catch (err) {
                console.error('Error stopping polling:');
                setTimeout(startPollingWithErrorHandling, 5000);
            }
        }
    });
}

function stopMessage(id){
    sendMessage({id: id,message: "Alert closed for stock recommendation"});
    isStop = true;
    eventEmitter.emit("isStop",isStop);
    // bot.stopPolling().then(() => console.log("polling stopped")).catch((error) => console.error(error))
}

module.exports = {sendMessage, startMessage, initializeBot}