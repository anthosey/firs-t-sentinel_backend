const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { param } = require('express-validator');
const operationzController = require('../controllers/operationz');
// const Client = require('../models/client');
const Transactionz = require('../models/transactionz');



// const isAuth = require('../middleware/isAuth');

// router.get('/drivers', isAuth, userController.getDrivers);
router.get('/transactions', operationzController.getTransactionz);
router.get('/transaction/:trx_id', operationzController.getOneTransaction);

router.get('/transactionsbyowner/:user_id', operationzController.getAllTransactionsByOwner);

router.get('/ownerbytransaction/:trx_id', operationzController.getOwnerByTransaction);

// router.get('/countrycode/:code', userController.getCountryCodes);
router.post('/addtransaction', [
    body('trx_ref_provider')
    .trim()
        .not()
        .isEmpty()
        .withMessage('Transaction Reference by provider'),

        body('company_code')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Company code is compulsory'),
        
        body('counter_party_code')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Counter party company code is compulsory'),

        body('trx_type')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Type of transaction is compulsory'),
            
        body('cscs_number')
                .trim()
                .not()
                .isEmpty()
                .withMessage('CSCS number of the beneficiary is compulsory'),
                
                
        body('beneficiary_name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Name of the beneficiary is compulsory'),

        body('trade_type')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Trade type type is compulsory (Buy or Sell)'),
                
        body('stock_symbol')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Stock symbol traded is compulsory'),

        body('volume')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Volume or quantity of stock traded is compulsory'),

        body('price')
                .trim()
                .not()
                .isEmpty()
                .withMessage('The unit price of the stock is compulsory'),

        body('provider_code')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Provider code is compulsory'),

], operationzController.addTransaction);

//***** DASHBOARD OPERATIONS BEGINS */
router.get('/vattoday/:dd/mm/:mm/year/:yyyy', operationzController.getVatToday); // Done for new

router.get('/vatbyhour/:dd/mm/:mm/year/:yyyy', operationzController.getVatHourly); // Done

router.get('/vatthismonth/:mm/year/:yyyy', operationzController.getVatMonthly); // Done for new

router.get('/vatthisquarter/:mm/year/:yyyy', operationzController.getVatQuarterly); // Done for new

router.get('/vatthisyear/:yyyy', operationzController.getVatYearly); // Done for new

router.get('/yearsummaryforallsectors/:yyyy', operationzController.getTrxYearlyAllSectors); // Done for new

router.get('/monthsummaryforallsectors/:yyyy', operationzController.getTrxMonthlyAllSectors);

router.get('/yearlyvatsegmentallsectors/:yyyy', operationzController.getVatSegmentYearlyAllSector); // Done for new

router.get('/alltransactionwithpages/:pagenumber/limitdata/:limit', operationzController.getTransactionzWithPages); // Done for new

//***** DASHBOARD OPERATIONS ENDS */


// *****SECTORS-CAPITAL MARKET, INSURANCE *****
router.get('/vattodaybysector/:sector', operationzController.getVatTodayBySector);

router.get('/vatweeklybysector/:sector', operationzController.getVatWeeklyBySector);

router.get('/vatmonthlybysector/:sector', operationzController.getVatMonthlyBySector);

router.get('/vatquarterlybysector/:sector', operationzController.getVatQuarterlyBySector);

router.get('/vatyearlybysector/:sector', operationzController.getVatYearlyBySector);

router.get('/yearlymarketsegmentbysector/:sector', operationzController.getMarketSegmentYearly);

router.get('/monthlyvatsegmentbysector/:yyyy/sector/:sector', operationzController.getVatMonthlyBySectorAllSubsector);


router.get('/monthlyvatsegmentbysectorInsurance/:yyyy/sector/:sector', operationzController.getVatMonthlyBySectorInsurance);

router.get('/yearlyvatsegmentbysector/:sector', operationzController.getVatSegmentYearlyBySector);

router.get('/sectortransactionwithpages/:pagenumber/limitdata/:limit/sector/:sector', operationzController.getSectorTransactionzWithPages);

// ***** SECTORS ENDS ******


// ***** SUB-SECTORS ENDS ******
router.get('/vattodaybysubsector/:subsector', operationzController.getVatTodayBySubSector);

router.get('/vatmonthlybysubsector/:subsector', operationzController.getVatMonthlyBySubSector);

router.get('/vatquarterlybysubsector/:subsector', operationzController.getVatQuarterlyBySubSector);

router.get('/vatyearlybysubsector/:subsector', operationzController.getVatYearlyBySubSector);

router.get('/vathourbysubsector/:dd/mm/:mm/year/:yyyy/subsector/:subsector', operationzController.getVatHourlyBySubSector);

router.get('/subsectortransactionwithpages/:pagenumber/limitdata/:limit/subsector/:subsector', operationzController.getSubSectorTransactionzWithPages);


// 1st, 2nd , 3rd and 4th Qtr summary of reports
router.get('/vatquarter1234bysector/:sector', operationzController.getVatQuarter1234BySector);

// ***** SUB-SECTORS ENDS ******

// ****** REPORTS *********
router.get('/numberofvatsalltimes', operationzController.getNumberOfVatsAllTimes);

router.get('/summaryofalltimes', operationzController.getSummaryOfAllTimes);

router.get('/topperformers/:total/year/:yyyy', operationzController.getTopPerfomersByYear);

// Transaction ID Only
router.get('/transactionswithtransactionid/:trxid', operationzController.getTransactionsByTrxIdOnly);

// Sub Sector Only
router.get('/transactionswithsubsectoronly/:pagenumber/limitdata/:limit/subsector/:subsector', operationzController.getTransactionsBySubSectorOnly);

// Sector Only
router.get('/transactionswithsectoronly/:pagenumber/limitdata/:limit/sector/:sector', operationzController.getTransactionsBySectorOnly);

// Dates Only
router.get('/transactionswith2datesonly/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit', operationzController.getTransactionsWith2Dates);

// Dates and sector
router.get('/transactionswith2datesandsector/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/sector/:sector', operationzController.getTransactionsWith2DatesandSector);

// Dates and Subsector
router.get('/transactionswith2datesandsubsector/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/subsector/:subsector', operationzController.getTransactionsWith2DatesandSubSector);

// Dates Only
router.get('/logswith2datesonly/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit', operationzController.getAuditTrailWith2Dates);
// ******REPORTS ENDS *****

// GET DATA FROM TAXPRO
// router.get('/vathourbysubsector/:dd/mm/:mm/year/:yyyy/subsector/:subsector', operationzController.getVatHourlyBySubSector);
router.get('/monthlypayment/:mm/yyyy/:yyyy', operationzController.getMonthlyPayment);

module.exports = router;