const puppeteer = require('puppeteer-extra');

const bullishMarStocksUrl = "https://chartink.com/screener/bullish-marubozu-for-15-min";
const bearishMarStocksUrl = "https://chartink.com/screener/bearish-marubozu-for-15min-timeframe";
const testUrl = 'https://chartink.com/screener/15-minute-stock-breakouts'

const isDebugging = false;

let bullishStockData;
let bearishStockData;

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function getDataFromChartink(){
  try{

    const browser = await puppeteer.launch({headless: !isDebugging});
    const bullishPage = await browser.newPage();
    const bearishpage = await browser.newPage();
    
    await bullishPage.setUserAgent(userAgent);
    await bearishpage.setUserAgent(userAgent);

    await bullishPage.goto(bullishMarStocksUrl,{ waitUntil: 'networkidle0' });
    await bearishpage.goto(bearishMarStocksUrl,{ waitUntil: 'networkidle0' });

    // await page.waitForSelector(selectors.resultTable);

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

module.exports = getDataFromChartink;