// required indicators
var log = require('../../core/log');

var EMA = require('./EMA.js');

var Indicator = function(config) {

    this.prev = null;
    this.ema_pdi = new EMA(config.emaweight);
    this.ema_mdi = new EMA(config.emaweight);
    this.ema_adx = new EMA(config.emaweight);


    //how many periods will be used in ATR calculation (average for period)
    this.period = config.period || 14;

    this.ATR = 0;
    this.age = 0;
    this.TR_SUM = 0;

    this.old_result = null;

}

/**
 *
 Current High - Previous High = UpMove
 Current Low - Previous Low = DownMove

 If UpMove > DownMove and UpMove > 0, then +DM = UpMove, else +DM = 0
 If DownMove > Upmove and Downmove > 0, then -DM = DownMove, else -DM = 0

 Once you have the current +DM and -DM calculated, the +DM and -DM lines can be
 calculated and plotted based on the number of user defined periods.

 +DI = 100 times Exponential Moving Average of (+DM / Average True Range)
 -DI = 100 times Exponential Moving Average of (-DM / Average True Range)

 Now that -+DX and -DX have been calculated, the last step is calculating the ADX.

 ADX = 100 times the Exponential Moving Average of the Absolute Value of (+DI - -DI) / (+DI + -DI)
 *
 */


/**
 * See plugins/tradingAdvisor/baseTradingMethod.js
 * @link https://www.tradingview.com/wiki/Directional_Movement_(DMI)
 * @param candle
 */
Indicator.prototype.update = function(candle) {

    //@var candle {id: int, start: {}, open: float, high: float, low: float, close: float, vwp: float, volume: float, trades: int }
    //@link https://www.tradingview.com/wiki/Directional_Movement_(DMI)
    // console.log('DMI candle', candle);

    var PDI,MDI,ADX,PDM,MDM, UpMove, DownMove, ATR, TR; //+DI, -DI, ADX, +DM, -DM, UpMove, DownMove, Average True Range, True Range

    //first candle, there are no previous data
    if ( this.prev === null) {

        this.result = null;
        this.prev = candle;
        this.age++;

        this.TR_SUM = candle.high - candle.low;

        return;
    }

    // https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/DMI
    /**
     * True Range is the greater of:
     Current High – Current Low
     Absolute value of Current High – Previous Close
     Absolute value of Current Low – Previous Close
     */


    /** Calculate ATR **/
    var TR = Math.max(candle.high - candle.low, Math.abs(candle.high - this.prev.close), Math.abs(candle.low - this.prev.close) );


    //http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:average_true_range_atr
    if (this.age <= this.period) {

        this.TR_SUM += TR;
        this.ATR = this.TR_SUM / this.age;

    }
    else {

        this.ATR = ( (this.ATR * (this.period -1) ) + TR) / this.period;
    }

    /** Calculate -DM, +DM **/
    UpMove = candle.high - this.prev.high;
    DownMove = candle.low - this.prev.low;

    if ( (UpMove > DownMove) && (UpMove > 0)) {
        PDM = UpMove;
    }
    else {
        PDM = 0;
    }

    if ( (DownMove > UpMove) && (DownMove > 0)) {

        MDM = DownMove;
    }
    else {
        MDM = 0;
    }

    this.age++;
    this.prev = candle;


    //there is no movements on the market
    if (this.ATR == 0 || (PDM == 0 && MDM == 0) ) {

        //return last non-zero values
        return this.old_result;

        // this.result = {
        //     PDI: 0, //float
        //     MDI: 0, //float
        //     ADX: 0, //float
        //     ATR: this.ATR
        // }

        return;
    }


    /** Calculate -DI, +DI, ADX **/
    PDI = 100 * this.ema_pdi.update(PDM / this.ATR);
    MDI = 100 * this.ema_mdi.update(MDM / this.ATR);

    // 100 * Exponential Moving Average of the Absolute Value of (+DI - -DI) / (+DI + -DI)
    var _di = Math.abs( (PDI - MDI) / (PDI + MDI) );
    ADX = 100 *  this.ema_adx.update( _di );

    this.result = {
        PDI: PDI, //float
        MDI: MDI, //float
        ADX: ADX, //float
        ATR: this.ATR
    }

    this.old_result = this.result;

}


module.exports = Indicator;
