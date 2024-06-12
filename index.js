const marubozuStocks = require('./marubozuStocks');

(async()=>{
    const marubozuStockData = await marubozuStocks();
    console.log(marubozuStockData.bullishStockData);
})()