const puppeteer = require('puppeteer');
require('dotenv').config();

const testUrl = 'https://chartink.com/screener/15-minute-stock-breakouts'
const bullishMarStocksUrl = "https://chartink.com/screener/bullish-marubozu-for-15-min";
const bearishMarStocksUrl = "https://chartink.com/screener/bearish-marubozu-for-15min-timeframe";

let isBrowserOpen = false;
let browser;
let bullishPage;
let bearishPage;

let bullishStockData;
let bearishStockData;

const selectors = {
  runBtnSelector: "[refs='run_scan']",
  dataTableSelector: "[id='DataTables_Table_0']"
}

const linuxUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";

async function openBrowser() {
  try {
    if (!isBrowserOpen) {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(),
        timeout: 0,
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--disable-dev-shm-usage"
          // "--single-process",
          // "--no-zygote"
        ]
      });
      bullishPage = await browser.newPage();
      bearishPage = await browser.newPage();

      await bullishPage.setUserAgent(linuxUserAgent);
      await bearishPage.setUserAgent(linuxUserAgent);

      await bullishPage.goto(bullishMarStocksUrl, { waitUntil: 'networkidle0', timeout: 0 });
      await bearishPage.goto(bearishMarStocksUrl, { waitUntil: 'networkidle0', timeout: 0 });

      bullishPage.setDefaultTimeout(60000)
      bearishPage.setDefaultTimeout(60000)

      isBrowserOpen = true;

      bullishPage.on('error', async (err) => {
        await browser.close();
        isBrowserOpen = false;
        console.log(`page error: ${err}`);
      });

      bearishPage.on('error', async (err) => {
        await browser.close();
        isBrowserOpen = false;
        console.log(`page error: ${err}`);
      });

      bullishPage.on('framenavigated', frame => {
        console.log('Frame navigated to:', frame.url());
      });

      bearishPage.on('framenavigated', frame => {
        console.log('Frame navigated to:', frame.url());
      });
    }
  } catch (e) {
    console.error(e)
  }
}

async function closeBrowser() {
  try {
    if (isBrowserOpen) {
      isBrowserOpen = false;
      await bullishPage.close();
      await bearishPage.close();
      await browser.close();
      browser = null;
      bullishPage = null;
      bearishPage = null;
    }

  } catch (e) {
    console.error(e);
  }
}

async function getDataFromWeb() {
  try {
    const bullRunScanBtn = await bullishPage.waitForSelector(selectors.runBtnSelector, { timeout: 0 })
    bullRunScanBtn.click();

    await bullishPage.waitForSelector(selectors.dataTableSelector, { timeout: 0 });
    const bullRows = await bullishPage.$$(`${selectors.dataTableSelector} tbody tr`)

    if (bullRows.length > 1) {
      bullishStockData = "Bullish Marubozu Stocks \n -------------------------  \n";
      for (let row of bullRows) {
        const cells = await row.$$('td');
        const name = await cells[1].evaluate(cell => cell.textContent.trim());
        const code = await cells[2].evaluate(cell => cell.textContent.trim());
        const price = await cells[5].evaluate(cell => cell.textContent.trim());
        const volume = await cells[6].evaluate(cell => cell.textContent.trim());
        bullishStockData +=
          `
        ${name} ( ${code} )
        Price: ${price}
        Volume: ${volume}
        \n
        `
      }
    } else {
      bullishStockData = "";
    }

    const bearRunScanBtn = await bearishPage.waitForSelector(selectors.runBtnSelector, { timeout: 0 })
    bearRunScanBtn.click();

    await bearishPage.waitForSelector(selectors.dataTableSelector, { timeout: 0 });
    const bearRows = await bearishPage.$$(`${selectors.dataTableSelector} tbody tr`)

    if (bearRows.length > 1) {
      bearishStockData = "Bearish Marubozu Stocks \n -------------------------  \n";
      for (let row of bearRows) {
        const cells = await row.$$('td');
        const name = await cells[1].evaluate(cell => cell.textContent.trim());
        const code = await cells[2].evaluate(cell => cell.textContent.trim());
        const price = await cells[5].evaluate(cell => cell.textContent.trim());
        const volume = await cells[6].evaluate(cell => cell.textContent.trim());
        bearishStockData +=
          `
        ${name} ( ${code} )
        Price: ${price} 
        Volume: ${volume}
        `
      }
    } else {
      bearishStockData = "";
    }
    return { bullishStockData, bearishStockData };
  } catch (e) {
    console.error(e);
  }
}

async function getDataFromChartink() {
  try {
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

    await bullishPage.goto(bullishMarStocksUrl, { waitUntil: 'networkidle0', timeout: 0 });
    await bearishpage.goto(process.env.ISTEST ? bearishMarStocksUrl : testUrl, { waitUntil: 'networkidle0', timeout: 0 });

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
  }
}

async function testData(res) {
  try {
    let testVal;
    if (isBrowserOpen) {
      console.log("broswer already open");
      const testRunBtn = await bearishPage.waitForSelector(selectors.runBtnSelector, { timeout: 60000 })
      testRunBtn.click();

      await bearishPage.waitForSelector(selectors.dataTableSelector, { timeout: 60000 });
      const testRows = await bearishPage.$$(`${selectors.dataTableSelector} tbody tr`)

      if (testRows.length > 1) {
        for (let row of testRows) {
          const cells = await row.$$('td');
          const name = await cells[1].evaluate(cell => cell.textContent.trim());
          testVal +=
            `
          ${name}
          \n
          `
        }
      } else {
        testVal = "no data is fetched";
      }
      res.send(testVal + "browser already open");
    } else {
      const browser = await puppeteer.launch({
        headless: "new",
        executablePath: puppeteer.executablePath(),
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
        ]
      });

      console.log("browser not already open");

      const page = await browser.newPage();

      await page.setUserAgent(linuxUserAgent);

      await page.goto(testUrl, { waitUntil: 'networkidle0', timeout: 0 });

      await page.waitForSelector("[id='DataTables_Table_0']", { timeout: 60000 });

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
      await browser.close();
      res.send(data);
    }
  } catch (error) {
    res.send(error)
  }
}

module.exports = { getDataFromChartink, testData };
// module.exports = { openBrowser, getDataFromWeb, closeBrowser, testData };