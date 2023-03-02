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
    body('cac_id')
    .trim()
        .not()
        .isEmpty()
        .withMessage('No Id found, personal or corporate'),

        // .custom (
        //     body('user_id').isEmpty()
        //     .withMessage('No Id found, personal or corporate')),
        body('company_name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Company\'s name can not be empty'),

        body('sector')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Sector of operation is compulsory'),

        body('sub_sector')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Sub-sector of operation is compulsory'),

        body('trx_type')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Type of transaction is compulsory'),
            
        body('trx_value')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Value of transaction is compulsory')

], operationzController.addTransaction);

//***** DASHBOARD OPERATIONS BEGINS */
router.get('/vattoday/:dd/mm/:mm/year/:yyyy', operationzController.getVatToday);

router.get('/vatbyhour/:dd/mm/:mm/year/:yyyy', operationzController.getVatHourly);

router.get('/vatthismonth/:mm/year/:yyyy', operationzController.getVatMonthly);

router.get('/vatthisquarter/:mm/year/:yyyy', operationzController.getVatQuarterly);

router.get('/vatthisyear/:yyyy', operationzController.getVatYearly);

router.get('/yearsummaryforallsectors/:yyyy', operationzController.getTrxYearlyAllSectors);

router.get('/monthsummaryforallsectors/:yyyy', operationzController.getTrxMonthlyAllSectors);

router.get('/yearlyvatsegmentallsectors/:yyyy', operationzController.getVatSegmentYearlyAllSector);

router.get('/alltransactionwithpages/:pagenumber/limitdata/:limit', operationzController.getTransactionzWithPages);

//***** DASHBOARD OPERATIONS ENDS */


// *****SECTORS-CAPITAL MARKET, INSURANCE *****
router.get('/vattodaybysector/:sector', operationzController.getVatTodayBySector);

router.get('/vatweeklybysector/:sector', operationzController.getVatWeeklyBySector);

router.get('/vatmonthlybysector/:sector', operationzController.getVatMonthlyBySector);

router.get('/vatquarterlybysector/:sector', operationzController.getVatQuarterlyBySector);

router.get('/vatyearlybysector/:sector', operationzController.getVatYearlyBySector);

router.get('/yearlymarketsegmentbysector/:sector', operationzController.getMarketSegmentYearly);

router.get('/monthlyvatsegmentbysector/:yyyy/sector/:sector', operationzController.getVatMonthlyBySectorAllSubsector);

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

// ******REPORTS ENDS *****

// 

module.exports = router;