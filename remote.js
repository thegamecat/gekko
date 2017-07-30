const http = require('http');

function callBacktestApi(strategiConfig) {
  var body = JSON.stringify(strategiConfig);
  var options = {
    host: 'localhost',
    port: 3000,
    path: '/api/backtest',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  return new Promise((resolve, reject) => {
    const postRequest = http.request(options, (response) => {
      let str = '';
      response.on('data', chunk => str += chunk);
      response.on('end', () => resolve(JSON.parse(str)));
    });
    postRequest.write(body);
    postRequest.end();
  });
}

function createMacdStragegy(params) {
  return {
    gekkoConfig: {
      watch: {
        exchange: params.exchange || 'poloniex',
        currency: params.currency || 'USDT',
        asset: params.asset || 'ETH',
      },
      paperTrader: {
        fee: 0.25,
        slippage: 0.05,
        riskFreeReturn: 2,
        simulationBalance: {
          asset: 0,
          currency: 3000
        },
        reportRoundtrips: true,
        enabled: true
      },
      backtest: {
        daterange: {
          from: '2017-04-01 00:00:00',
          to: '2017-07-01 00:00:00',
        }
      },
      valid: true,
      'MACD': {
        short: params.short,
        long: params.long,
        signal: params.signal,
        thresholds: {
          down: params.down,
          up: params.up,
          persistence: params.persistence,
        }
      },
      'tradingAdvisor': {
        enabled: true,
        method: 'MACD',
        candleSize: params.candleSize,
        historySize: params.historySize,
      },
      performanceAnalyzer: {
        enabled: true,
        riskFreeReturn: 5
      }
    },
    data: {
      candleProps: [ 'close',  'start' ],
      indicatorResults: true,
      report: true,
      roundtrips: true,
      trades: true
    }
  }
}

const backtestStrategy1 = createMacdStragegy({
  long: 22,
  short: 18,
  signal: 12,
  down: '-0.025',
  up: '0.025',
  persistence: 1,
  candleSize: 60,
  historySize: 10,
});

const backtestStrategy2 = createMacdStragegy({
  long: 1122,
  short: 1118,
  signal: 1112,
  down: '-0.025',
  up: '0.025',
  persistence: 1,
  candleSize: 60,
  historySize: 10,
});

const backtestStrategy3 = createMacdStragegy({
  long: 2222,
  short: 2218,
  signal: 2212,
  down: '-0.025',
  up: '0.025',
  persistence: 1,
  candleSize: 60,
  historySize: 10,
});

const test1Promise = callBacktestApi(backtestStrategy1);
const test2Promise = callBacktestApi(backtestStrategy2);
const test3Promise = callBacktestApi(backtestStrategy3);

Promise.all([test1Promise, test2Promise, test3Promise]).then((results) => {
	console.log(results);
  console.log(`test1: Trades: ${results[0].trades.length} Balance: ${results[0].report.balance}`);
  console.log(`test2: Trades: ${results[1].trades.length} Balance: ${results[1].report.balance}`);
  console.log(`test3: Trades: ${results[2].trades.length} Balance: ${results[2].report.balance}`);
});