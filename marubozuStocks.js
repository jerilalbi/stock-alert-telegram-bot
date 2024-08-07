const puppeteerExtra = require('puppeteer-extra');
const puppeteer = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { timeout } = require('puppeteer');

require('dotenv').config();

const testUrl = 'https://chartink.com/screener/15-minute-stock-breakouts'
const bullishMarStocksUrl = "https://chartink.com/screener/bullish-marubozu-for-15-min";
const bearishMarStocksUrl = "https://chartink.com/screener/bearish-marubozu-for-15min-timeframe";

let bullishStockData;
let bearishStockData;

const selectors = {
  runBtnSelector: "[refs='run_scan']",
  dataTableSelector: "[id='DataTables_Table_0']"
}

const linuxUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";

async function getDataFromChartink() {
  puppeteerExtra.use(StealthPlugin());

  const browser = await puppeteerExtra.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote"
    ],
    executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    headless: true,
    ignoreHTTPSErrors: true,
    timeout: 0,
  });
  try {
    const bullishPage = await browser.newPage();
    const bearishpage = await browser.newPage();

    await bullishPage.setUserAgent(linuxUserAgent);
    await bearishpage.setUserAgent(linuxUserAgent);

    await bullishPage.goto(bullishMarStocksUrl, { waitUntil: 'networkidle0', timeout: 0 });
    await bearishpage.goto(process.env.ISTEST ? bearishMarStocksUrl : testUrl, { waitUntil: 'networkidle0', timeout: 0 });

    bullishPage.setDefaultTimeout(0)
    bearishpage.setDefaultTimeout(0)

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

    await bullishPage.waitForSelector("[id='DataTables_Table_0']", { timeout: 60000 });
    await bearishpage.waitForSelector("[id='DataTables_Table_0']", { timeout: 60000 });

    const bullishTableData = await bullishPage.evaluate(() => {
      const table = document.querySelector("[id='DataTables_Table_0']");
      if (!table) {
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
      if (!table) {
        console.log("no data")
        return null
      };

      const rows = Array.from(table.querySelectorAll('tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map(cell => cell.textContent);
      });
    });

    if (bullishTableData[1][1] == undefined) {
      bullishStockData = "";
    } else {
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

    if (bearishTableData[1][1] == undefined) {
      bearishStockData = "";
    } else {
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
    return { bullishStockData, bearishStockData };
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
}

async function testData(res) {
  puppeteerExtra.use(StealthPlugin())

  const browser = await puppeteerExtra.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote"
    ],
    executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    headless: true,
    ignoreHTTPSErrors: true,
    timeout: 0,
  });
  try {
    const page = await browser.newPage();

    await page.setUserAgent(linuxUserAgent);

    await page.goto(testUrl, { waitUntil: 'networkidle0', timeout: 0 });

    await page.waitForSelector("[id='DataTables_Table_0']", { timeout: 0 });

    const data = await page.evaluate(() => {
      const table = document.querySelector("[id='DataTables_Table_0']");
      if (!table) {
        console.log("no data")
        return null
      };

      const rows = Array.from(table.querySelectorAll('tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map(cell => cell.textContent);
      });
    });
    res.send(data);
  } catch (error) {
    res.send(error)
  } finally {
    await browser.close();
  }
}
module.exports = { getDataFromChartink, testData };