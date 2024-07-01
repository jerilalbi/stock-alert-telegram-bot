const { timeout } = require('puppeteer');
const puppeteer = require('puppeteer');
require('dotenv').config();

const testUrl = 'https://chartink.com/screener/15-minute-stock-breakouts'
const bullishMarStocksUrl = "https://chartink.com/screener/bullish-marubozu-for-15-min";
const bearishMarStocksUrl = process.env.ISTEST ? testUrl : "https://chartink.com/screener/bearish-marubozu-for-15min-timeframe";

let bullishStockData;
let bearishStockData;

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const linuxUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";

async function getDataFromChartink(){
  try{
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: puppeteer.executablePath(),
      timeout: 60000,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        // "--single-process",
        // "--no-zygote"
      ]
    });
    const bullishPage = await browser.newPage();
    const bearishpage = await browser.newPage();
    
    await bullishPage.setUserAgent(linuxUserAgent);
    await bearishpage.setUserAgent(linuxUserAgent);

    await bullishPage.goto(bullishMarStocksUrl,{ waitUntil: 'networkidle0',timeout: 0 });
    await bearishpage.goto(bearishMarStocksUrl,{ waitUntil: 'networkidle0',timeout: 0 });

    bullishPage.setDefaultTimeout(60000)
    bearishpage.setDefaultTimeout(60000)

    bullishPage.on('error', err => {
      console.log(`page error: ${err}`);
    });

    bearishpage.on('error', err => {
      console.log(`page error: ${err}`);
    });

    bullishPage.on('framenavigated', frame => {
      console.log('Frame navigated to:', frame.url());
    });

    bearishpage.on('framenavigated', frame => {
      console.log('Frame navigated to:', frame.url());
    });

    await bullishPage.waitForSelector("[id='DataTables_Table_0']",{timeout: 60000});
    await bearishpage.waitForSelector("[id='DataTables_Table_0']",{timeout: 60000});

    const bullishTableData = await bullishPage.evaluate(() => {
        const table = document.querySelector("[id='DataTables_Table_0']");
        if(!table){
            console.log("no data")
            return null
        };

        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          return cells.map(cell => cell.textContent);
        });
      });

    const bearishTableData = await bearishpage.evaluate(() => {
        const table = document.querySelector("[id='DataTables_Table_0']");
        if(!table){
            console.log("no data")
            return null
        };

        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          return cells.map(cell => cell.textContent);
        });
      });

      if(bullishTableData[1][1] == undefined){
        bullishStockData = "";
      } else{
        bullishStockData = "Bullish Marubozu Stocks \n -------------------------  \n";
        bullishTableData.slice(1).map(data => {
          bullishStockData += 
          `
          ${data[1]} ( ${data[2]} )
          Price: ${data[5]}
          Volume: ${data[6]}
          `
        })
      }

      if(bearishTableData[1][1] == undefined){
        bearishStockData = "";
      } else{
        bearishStockData = "Bearish Marubozu Stocks \n -------------------------  \n"
        bearishTableData.slice(1).map(data => {
          bearishStockData += 
          `
          ${data[1]} ( ${data[2]} )
          Price: ${data[5]}
          Volume: ${data[6]}
          `
        })
      }

      await browser.close();
      return {bullishStockData,bearishStockData};
  }catch(error){
    console.error(error);
  }
}

async function testData(res){
  try{
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: puppeteer.executablePath(),
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ]
    });

    const page = await browser.newPage();
    
    await page.setUserAgent(linuxUserAgent);

    await page.goto(testUrl,{ waitUntil: 'networkidle0',timeout: 0 });

    await page.waitForSelector("[id='DataTables_Table_0']",{timeout: 60000});

    const data = await page.evaluate(() => {
        const table = document.querySelector("[id='DataTables_Table_0']");
        if(!table){
            console.log("no data")
            return null
        };

        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          return cells.map(cell => cell.textContent);
        });
      });
    await browser.close();
    res.send(data);

  }catch(error){
    res.send(error)
  }
}

module.exports = { getDataFromChartink, testData };