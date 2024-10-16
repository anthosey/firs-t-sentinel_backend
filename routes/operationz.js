const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { param } = require('express-validator');
const operationzController = require('../controllers/operationz');
// const Client = require('../models/client');
const Transactionz = require('../models/transactionz');



const isAuth = require('../middleware/isAuth');

// router.get('/drivers', isAuth, userController.getDrivers);
router.get('/transactions', isAuth, operationzController.getTransactionz);
router.get('/transaction/:trx_id', isAuth, operationzController.getOneTransaction);

router.get('/transactionsbyowner/:user_id', isAuth,  operationzController.getAllTransactionsByOwner);

router.get('/transactionsbyownerwith2dates/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit', isAuth, operationzController.getAllTransactionsByOwnerWith2Dates);

router.get('/ownerbytransaction/:trx_id', isAuth, operationzController.getOwnerByTransaction);

// router.get('/countrycode/:code', userController.getCountryCodes);
router.post('/addtransaction', isAuth, [
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
        
        // body('counter_party_cscs')
        //         .trim()
        //         .not()
        //         .isEmpty()
        //         .withMessage('Counter party CSCS Number is compulsory'),
        
        // body('counter_party_name')
        //         .trim()
        //         .not()
        //         .isEmpty()
        //         .withMessage('Counter party Customer Name is compulsory'),

], operationzController.addTransaction);

//***** DASHBOARD OPERATIONS BEGINS */
router.get('/vattoday/:dd/mm/:mm/year/:yyyy', isAuth, operationzController.getVatToday); // Done for new

router.get('/vatbyhour/:dd/mm/:mm/year/:yyyy', isAuth, operationzController.getVatHourly); // Done

router.get('/vatthismonth/:mm/year/:yyyy', isAuth, operationzController.getVatMonthly); // Done for new

router.get('/vatthisquarter/:mm/year/:yyyy', isAuth, operationzController.getVatQuarterly); // Done for new

router.get('/vatthisyear/:yyyy', isAuth, operationzController.getVatYearly); // Done for new

router.get('/yearsummaryforallsectors/:yyyy', isAuth, operationzController.getTrxYearlyAllSectors); // Done for new

router.get('/monthsummaryforallsectors/:yyyy', isAuth, operationzController.getTrxMonthlyAllSectors);

router.get('/yearlyvatsegmentallsectors/:yyyy', isAuth, operationzController.getVatSegmentYearlyAllSector); // Done for new

router.get('/alltransactionwithpages/:pagenumber/limitdata/:limit', isAuth, operationzController.getTransactionzWithPages); // Done for new

router.get('/vatthisyearbyregion/:yyyy', isAuth, operationzController.getVatYearlyByRegion); // Done for new

router.get('/vatthisyearbythreshold/:yyyy', isAuth, operationzController.getVatYearlyByThreshold); // Done for new

//***** DASHBOARD OPERATIONS ENDS */


// *****SECTORS-CAPITAL MARKET, INSURANCE *****
router.get('/vattodaybysector/:sector', isAuth, operationzController.getVatTodayBySector);

router.get('/vatweeklybysector/:sector', isAuth, operationzController.getVatWeeklyBySector);

router.get('/vatmonthlybysector/:sector', isAuth, operationzController.getVatMonthlyBySector);

router.get('/vatquarterlybysector/:sector', isAuth, operationzController.getVatQuarterlyBySector);

router.get('/vatyearlybysector/:sector', isAuth, operationzController.getVatYearlyBySector);

router.get('/yearlymarketsegmentbysector/:sector', isAuth, operationzController.getMarketSegmentYearly);

router.get('/monthlyvatsegmentbysector/:yyyy/sector/:sector', isAuth, operationzController.getVatMonthlyBySectorAllSubsector);


router.get('/monthlyvatsegmentbysectorInsurance/:yyyy/sector/:sector', isAuth, operationzController.getVatMonthlyBySectorInsurance);

router.get('/yearlyvatsegmentbysector/:sector', isAuth, operationzController.getVatSegmentYearlyBySector);

router.get('/sectortransactionwithpages/:pagenumber/limitdata/:limit/sector/:sector', isAuth, operationzController.getSectorTransactionzWithPages);

// ***** SECTORS ENDS ******


// ***** SUB-SECTORS ENDS ******
router.get('/vattodaybysubsector/:subsector', isAuth, operationzController.getVatTodayBySubSector);

router.get('/vatmonthlybysubsector/:subsector', isAuth, operationzController.getVatMonthlyBySubSector);

router.get('/vatquarterlybysubsector/:subsector', isAuth, operationzController.getVatQuarterlyBySubSector);

router.get('/vatyearlybysubsector/:subsector', isAuth, operationzController.getVatYearlyBySubSector);

router.get('/vathourbysubsector/:dd/mm/:mm/year/:yyyy/subsector/:subsector', isAuth, operationzController.getVatHourlyBySubSector);

router.get('/subsectortransactionwithpages/:pagenumber/limitdata/:limit/subsector/:subsector', isAuth, operationzController.getSubSectorTransactionzWithPages);


// 1st, 2nd , 3rd and 4th Qtr summary of reports
router.get('/vatquarter1234bysector/:sector', isAuth, operationzController.getVatQuarter1234BySector);

// ***** SUB-SECTORS ENDS ******

// ****** REPORTS *********
router.get('/numberofvatsalltimes', isAuth, operationzController.getNumberOfVatsAllTimes);

router.get('/summaryofalltimes', isAuth, operationzController.getSummaryOfAllTimes);

router.get('/topperformers/:total/year/:yyyy', isAuth, operationzController.getTopPerfomersByYear);

// Transaction ID Only
router.get('/transactionswithtransactionid/:trxid', isAuth, operationzController.getTransactionsByTrxIdOnly);

// Sub Sector Only
router.get('/transactionswithsubsectoronly/:pagenumber/limitdata/:limit/subsector/:subsector', isAuth, operationzController.getTransactionsBySubSectorOnly);

// Sector Only
router.get('/transactionswithsectoronly/:pagenumber/limitdata/:limit/sector/:sector', isAuth, operationzController.getTransactionsBySectorOnly);

// Dates Only
router.get('/transactionswith2datesonly/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit', isAuth, operationzController.getTransactionsWith2Dates);

// Dates and sector
router.get('/transactionswith2datesandsector/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/sector/:sector', isAuth, operationzController.getTransactionsWith2DatesandSector);

// Dates and Subsector
router.get('/transactionswith2datesandsubsector/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/subsector/:subsector', isAuth, operationzController.getTransactionsWith2DatesandSubSector);

// Dates Only
router.get('/logswith2datesonly/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit', isAuth, operationzController.getAuditTrailWith2Dates);


// Dates and region
router.get('/transactionswith2datesandregion/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/region/:region', isAuth, operationzController.getTransactionsWith2DatesandRegion);

// Dates and State
router.get('/transactionswith2datesandstate/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/state/:state', isAuth, operationzController.getTransactionsWith2DatesandState);

// Dates and TIN
router.get('/transactionswith2datesandtin/:dd1/mm1/:mm1/yyyy1/:yyyy1/dd2/:dd2/mm2/:mm2/yyyy2/:yyyy2/page/:pagenumber/limitdata/:limit/tin/:tin', isAuth, operationzController.getTransactionsWith2DatesandTIN);
// ******REPORTS ENDS *****

// GET DATA FROM TAXPRO
// router.get('/vathourbysubsector/:dd/mm/:mm/year/:yyyy/subsector/:subsector', operationzController.getVatHourlyBySubSector);
router.get('/monthlypayment/:mm/yyyy/:yyyy', isAuth, operationzController.getMonthlyPayment);

router.get('/vatpaidbytin/:tin/mm/:mm/yyyy/:yyyy', isAuth, operationzController.getVatPaidByTin);

router.get('/vatrecordedbytin/:tin/mm/:mm/yyyy/:yyyy', isAuth, operationzController.getVatRecordedByTin);

module.exports = router;