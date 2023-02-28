const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/company');
const Personal = require('../models/personal');
const Transactionz = require('../models/transactionz');
// const { parseTwoDigitYear } = require('moment');
// const moment = require('moment');


function generateToken(n) {
  
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   
    console.log(n);
    // if ( n > max ) {
    //         return generate(max) + generate(n - max);
    // }
    max        = Math.pow(10, n+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;

    return ("" + number).substring(add); 
}


exports.getTransactionz= (req, res, next) => { 
    // console.log('Filter:: ' + tempFilter);
        Transactionz.find()
        .then(trxs => {
            res.status(200).json({message: 'success', data: trxs});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

exports.getOneTransaction = (req, res, next) => {
    const trxId = req.params.trx_id;
    console.log('trxID:' + trxId);
    Transactionz.findOne({trx_id: trxId})
    .then(trxs => {
        console.log(JSON.stringify(trxs));
        res.status(200).json(trxs);
        
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}


exports.getAllTransactionsByOwner = (req, res, next) => {
    // const cacId = req.params.cac_id;
    const userId = req.params.user_id;
    // console.log('U ID::' + userId);
    Transactionz.find({user_id: userId})
    .then(trxs => {
        if (trxs) {
            res.status(201).json({'message': 'Success', 'data': trxs });
        } else {
            res.status(201).json({'message':'No data found' });
        }
      
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.getOwnerByTransaction = (req, res, next) => {
    const trxId = req.params.trx_id;
    // const userId = req.params.user_id;
    Transactionz.findOne({trx_id: trxId})
    .then(trx => {
        if (trx) {
            Company.findOne({cac_id: trx.cac_id})
            .then(coy =>{

                if (coy) {
                    res.status(201).json({message: 'success', data: coy});
                }
             else
                {
                    Personal.findOne({user_id: userId})
                    .then (pers =>{
                        if (!pers) {
                            res.status(201).json({message: 'No user found!'});                    
                        }
                        res.status(201).json({message: 'success', data: pers});                           
                })
            }
        })
    }
        else {
            res.status(201).json({message: 'No transaction found!'});
         }
        return trx;
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.addTransaction = (req, res, next) => {
    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const trxId = generateToken(10);
 
    const cac_id = req.body.cac_id;
    var user_id = req.body.user_id
    const personal_id = req.body.personal_id;
    const company_name = req.body.company_name;
    const sector = req.body.sector;
    const sub_sector = req.body.sub_sector;
    const trx_type = req.body.trx_type;
    const trx_value = req.body.trx_value;
    const vat = (+req.body.trx_value * 7.5)/100;
    const remarks = req.body.remarks;
    
    if (cac_id) user_id = cac_id;
    if (personal_id) user_id = personal_id;

        const transaction = new Transactionz({
            trx_id: trxId,
            cac_id: cac_id,
            user_id: user_id,
            company_name: company_name,
            sector: sector,
            sub_sector: sub_sector,
            trx_type: trx_type,
            trx_value: trx_value,
            // vat: (trx_value * 7.5)/100
            vat: vat,

            remarks: remarks
                        
            });
            
            transaction.save()
             
            .then(dat => {
                console.log('record::' + dat + ', Trx ID::' + trxId);
                res.status(201).json({
                    message: 'Transaction saved successfully',
                    data: {trx_id: trxId,
                        cac_id: cac_id,
                        user_id: user_id,
                        company_name: company_name,
                        sector: sector,
                        sub_sector: sub_sector,
                        trx_type: trx_type,
                        trx_value: trx_value,
                        vat: vat,
                        remarks: remarks      }
            })
        })
                
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
}

// ***** DASHBOARD  BEGINS ********

exports.getVatHourly = (req, res, next) => { 
    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate.setHours(firstDate.getHours() + 1);
    // lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        if (!dat[0]) dat[0] = 0;


        // 2AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;
       
                // 3AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;


                // 4AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
         
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // 5AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // 6AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;
        
        // 7AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // 8AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // 9AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // 10AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        if (!dat9[0]) dat9[0] = 0;


        // 11AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        if (!dat10[0]) dat10[0] = 0;


        
        // 12PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        if (!dat11[0]) dat11[0] = 0;


        // 1PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat12 => {
        if (!dat12[0]) dat12[0] = 0;

        // 2PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        console.log('firstD::' + firstDate);
        console.log('lastD::' + lastDate);
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat13 => {
        if (!dat13[0]) dat13[0] = 0;

        // 3PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat14 => {
        if (!dat14[0]) dat14[0] = 0;

        // 4PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat15 => {
        if (!dat15[0]) dat15[0] = 0;

        // 5PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat16 => {
        if (!dat16[0]) dat16[0] = 0;

        // 6PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat17 => {
        if (!dat17[0]) dat17[0] = 0;

        // 7PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat18 => {
        if (!dat18[0]) dat18[0] = 0;

        // 8PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat19 => {

        if (!dat19[0]) dat19[0] = 0;
        // 9PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat20 => {
        if (!dat20[0]) dat20[0] = 0;

        // 10PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat21 => {
        if (!dat21[0]) dat21[0] = 0;

        // 11PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat22 => {
        if (!dat22[0]) dat22[0] = 0;

        // 12AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat23 => {
        if (!dat23[0]) dat23[0] = 0;


        // let obj = 
        let arrData = [{"1AM": dat, "2AM": dat1, "3AM": dat2, "4AM": dat3, "5AM": dat4, "6AM": dat5, "7AM": dat6,
    "8AM": dat7, "9AM": dat8, "10AM": dat9, "11AM": dat10, "12PM": dat11, "1PM": dat12, "2PM": dat13, "3PM": dat14, 
    "4PM": dat15, "5PM": dat16, "6PM": dat17, "7PM": dat18, "8PM": dat19, "9PM": dat20, "10PM": dat21, "11PM": dat22, "12AM": dat23}];
       
        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 
});
});
});
}); 
}); 
}); 
}); 
});
});
});
});
});
});
});
}


exports.getVatToday = (req, res, next) => { 
    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;

    console.log('dd: ' + dd + ' mm: ' + mm + ', yyyy: ' + yyyy);

    if (!dd || !mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    console.log('After dd: ' + dd + ' mm: ' + mm + ', yyyy: ' + yyyy);

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    firstDate.setHours(00, 00);
    lastDate.setHours(23, 59);
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);
        firstDate.setHours(00, 00);
        lastDate.setHours(23, 59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatMonthly = (req, res, next) => { 
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    
    if (!mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
    }
    
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));

    // var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    var lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);

    lastDayOfMonth.setHours(23,59);

  
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    // console.log('Sector:' + sector);

    // console.log('firstDate:' + firstDayOfMonth);
    // console.log('lastDate: '+ lastDayOfMonth);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous month's  transaction
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        // lastDate = lastDayOfMonth;
        // var d = new Date(2023, lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100

          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }        
          

        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

function getQuarter(mm, yyyy) {
    var firstDate;
    var testDate;
    var lastDate;

console.log('Month in Fnct: ' + mm);
    switch(mm) {
        case 0:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
          return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 1:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
          return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 2:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
           return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 3:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
           return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 4:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 5:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 6:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 7:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 8:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 9:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
        case 10:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
        case 11:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
       
      }
}


function getLastQuarter(mm, yyyy) {
    var firstDate;
    var testDate;
    var lastDate;

console.log('Month in Fnct: ' + mm);
    switch(mm) {
        case 0:
          return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 1:
            return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 2:
        
        return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 3:
        
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 4:
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 5:
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 6:
            
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 7:
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 8:
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 9:
           
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
        case 10:
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
        case 11:
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
       
      }
}

exports.getVatQuarterly = (req, res, next) => { 

    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    console.log('mm: ' + mm + ', yyyy: ' + yyyy );
    
    if (!mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
    }


    let qtrObject = getQuarter(mm, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Last Qtr's  transaction

        let lastQtrObject = getLastQuarter(mm, yyyy);
        // console.log('Last QT bjt:: ' + lastQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatYearly = (req, res, next) => { 
    // var sector = req.params.sector;
    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous Year's  transactions
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          
          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}



exports.getTrxYearlyAllSectors = (req, res, next) => { 
var yyyy = +req.params.yyyy;

if (!yyyy) {
    const today = new Date();
    const yyyy = today.getFullYear();
}
    
    console.log('Log year: ' + yyyy);
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    console.log('FirstD:' + firstDate);
    console.log('SecndD:' + lastDate);

     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$trx_value"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {

        // calculate percentage
        if (dat) {

            for (i = 0; i < dat.length; i++){
                sumValue += dat[i].totalSum;
            }

            for (i = 0; i < dat.length; i++) {
                var ans = (dat[i].totalSum * 100)/sumValue;
                var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                dadas = dadas + tempview;
            }

            dadas = dadas.substring(0, dadas.length - 1);
            dadas = "{" + dadas + "}" ;
            console.log(dadas);
            var perc = JSON.parse(dadas);

        }

        res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}
        
var months = [];
function recursionGetByMonth(mm, yyyy) {

    if (mm == 0) {
        firstDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        testDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
    
        console.log('firstDate_0:' + mm + ' ' + firstDate);
        console.log('lastDate_0: '+ mm + ' ' + lastDate);
        
         var sumValue = 0;
         var dadas = '';
          Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ]
          ).then(dat => {
            let mnth = {mm: dat[0]};
            // console.log(mnth);
            // console.log(mnth.mm._id);
            months.push (mnth);
            console.log(months[0]);
            console.log('in-Recursion::' + months);
   
          })
          return months;
    } else {

        firstDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        testDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
    
        console.log('firstDate_:' + firstDate);
        console.log('lastDate_: '+ lastDate);
        
         var sumValue = 0;
         var dadas = '';
          Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ]
          ).then(dat => {
           let mnth = {mm: dat[0]};
           months.push (mnth);
           return recursionGetByMonth(mm - 1); //Call Recursive function

          })

        
    }
    
    
}

// exports.getTrxMonthlyAllSectors_old = (req, res, next) => { 
//   var mm = +req.params.mm;
//     var yyyy = +req.params.yyyy;

//     // Get current month
//     const today = new Date();
   
//      recursionGetByMonth(mm, yyyy);
//      console.log('X:' + months[0]);
//          res.status(200).json({message: 'success', data: months});  
     
       
// }


exports.getTrxMonthlyAllSectors = (req, res, next) => { 
    var yyyy = +req.params.yyyy;
   
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        if (!dat[0]) dat[0] = 0;


        // February
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;

       
                // March
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;

                // April
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // May
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // June
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;
        
        // July
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // August
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // September
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // October
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        if (!dat9[0]) dat9[0] = 0;


        // November
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {

        if (!dat10[0]) dat10[0] = 0;

        // December
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        if (!dat11[0]) dat11[0] = 0;

        // let obj = 
        let arrData = [{"January": dat, "February": dat1, "March": dat2, "April": dat3, "May": dat4, "June": dat5, "July": dat6,
    "August": dat7, "September": dat8, "October": dat9, "November": dat10, "December": dat11}];
       
        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
});  //End of February
}); // End of January
}); // End of March
}) //End of April
}) //End of May
}) //End of June
}) //End of July
}) //End of August
}) //End of September
}) //End of October
}

exports.getVatSegmentYearlyAllSector = (req, res, next) => { 
    // const today = new Date();
    // const yyyy = today.getFullYear();
    // var mm = today.getMonth();
    // const dd = today.getDate();

    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
    }
    

    // var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth() + 1, 0);

    console.log('firstDate :' + firstDate);
    console.log('lastDate :' + lastDate);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

         // Check Previous Year's  transactions
         firstDate.setFullYear(firstDate.getFullYear() - 1);
         lastDate.setFullYear(lastDate.getFullYear() - 1);
         var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
         
         lastDate2.setHours(23,59);
 
         console.log('sDate :' + firstDate);
         console.log('eDate :' + lastDate2);
         
         const previous = await Transactionz.aggregate([
             {
                 $match: {'createdAt': {
                     $gte: firstDate,
                     $lte: lastDate2}}
             },
             {
                 $group: {
     
                     _id: "$sector",
                     totalSum: { $sum: "$vat"},
                     count: { $sum: 1 }
                 }
             }
           ])
         
         
           // calculate percentage change 
           //   Formula
           //   ((newPrice - oldPrice)/oldPrice) * 100

        //    console.log('dat: ' + ':' + dat[0]._id);
        //    console.log('previous: ' + ':' + previous[0]._id);

        //    // Sorting 
        //    dat.sort(function(a, b){return a - b});
        //    previous.sort(function(a, b){return a - b});
        //    // dat.sort();
        //    // previous.sort();

        //    console.log('After Sorting..');
        //    console.log('dat: ' + ':' + dat[0]._id);
        //    console.log('previous: ' + ':' + previous[0]._id);

           var percentChange = 0;
           if (previous[0]) percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;

           for (i = 0; i < dat.length; i++) {
            for (let k = 0; k < previous.length; k++) {

                if (dat[i] && previous[k]) {
                                     
                    if (dat[i]._id === previous[k]._id) {
                        console.log('dat: ' + i + ':' + dat[i]._id + ', previous: ' + previous[k]._id);

                        var ans = ((dat[i].totalSum - previous[k].totalSum) / previous[k].totalSum) * 100;
                        var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                            dadas = dadas + tempview;
                    }
    
                    
                }
            }
            
        }
    
                dadas = dadas.substring(0, dadas.length - 1);
                dadas = "{" + dadas + "}" ;
                console.log(dadas);
                var perc = JSON.parse(dadas);
            
         
         res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: perc});        

        // res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getTransactionzWithPages = (req, res, next) => { 
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    console.log('Page: ' + page);
    console.log('Limit: ' + limit);

        Transactionz.find({},'trx_id company_name sector trx_type trx_value vat remarks')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Transactionz.count();
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

// ***** DASHBOARD  ENDS ********


// ***** SECTOR- CAPITAL MARKET, INSURANCE BEGINS ********

exports.getVatTodayBySector = (req, res, next) => { 
    var sector = req.params.sector;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 23, 59, 00));
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

function setToMonday( date ) {
    var day = date.getDay() || 7;  

    if( day !== 1 ) 
        date.setHours(-24 * (day - 1)); 
    return date;
}

exports.getVatWeeklyBySector = (req, res, next) => { 
    var sector = req.params.sector;
    const today = new Date();
   
    var mondayDate = setToMonday(today);
    
    const yyyy1 = mondayDate.getFullYear();
    const mm1 = mondayDate.getMonth();
    const dd1 = mondayDate.getDate();
    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));

    var sundayDate = setToMonday(today);
    sundayDate.setDate(sundayDate.getDate() + 5);
    const yyyy2 = sundayDate.getFullYear();
    const mm2 = sundayDate.getMonth();
    const dd2 = sundayDate.getDate();

    
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 23, 59, 00));
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous week's  transaction
        firstDate.setDate(firstDate.getDate() - 7);
        lastDate.setDate(lastDate.getDate() - 7);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
          }

        res.status(200).json({message: 'success', thisWeek: dat, lastWeek: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatMonthlyBySector = (req, res, next) => { 
    console.log('Got Hiaaa');
    var sector = req.params.sector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    console.log('Sector:' + sector);
    console.log('Today:' + today);
    console.log('dd' + dd + ', mm:' + mm + ', year: ' + yyyy);
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));

    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    lastDayOfMonth.setHours(23,59);

  
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfMonth);
    console.log('lastDate: '+ lastDayOfMonth);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous month's  transaction
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        // lastDate = lastDayOfMonth;
        // var d = new Date(2023, lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
          

        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatQuarterlyBySector = (req, res, next) => { 
    var sector = req.params.sector;
    
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    let qtrObject = getQuarter(mm, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Last Qtr's  transaction

        let lastQtrObject = getLastQuarter(mm, yyyy);
        console.log('Last QT bjt:: ' + lastQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) { 
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
        }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatYearlyBySector = (req, res, next) => { 
    var sector = req.params.sector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous Year's  transactions
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getMarketSegmentYearly = (req, res, next) => { 
    const today = new Date();
    const yyyy = today.getFullYear();
    var mm = today.getMonth();
    const dd = today.getDate();

    var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$trx_value"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {

        // calculate percentage
        if (dat) {

            for (i = 0; i < dat.length; i++){
                sumValue += dat[i].totalSum;
            }

            for (i = 0; i < dat.length; i++) {
                var ans = (dat[i].totalSum * 100)/sumValue;
                var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                dadas = dadas + tempview;
            }

            dadas = dadas.substring(0, dadas.length - 1);
            dadas = "{" + dadas + "}" ;
            console.log(dadas);
            var perc = JSON.parse(dadas);

        }

        res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}
            

exports.getVatMonthlyBySectorAllSubsector = (req, res, next) => { 
    var yyyy = +req.params.yyyy;
    var sector = req.params.sector;
    console.log('Sector: ' + sector + 'Year: ' + yyyy);
   
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {

        if (!dat[0]) dat[0] = 0;

        // February
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;

                // March
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;

                // April
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // May
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // June
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;

        // July
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // August
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // September
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // October
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {

        if (!dat9[0]) dat9[0] = 0;

        // November
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        if (!dat10[0]) dat10[0] = 0;

        // December
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {

        if (!dat11[0]) dat11[0] = 0;

        // let obj = 
        let arrData = [{"January": dat, "February": dat1, "March": dat2, "April": dat3, "May": dat4, "June": dat5, "July": dat6,
    "August": dat7, "September": dat8, "October": dat9, "November": dat10, "December": dat11}];
       
        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
});  //End of February
}); // End of January
}); // End of March
}) //End of April
}) //End of May
}) //End of June
}) //End of July
}) //End of August
}) //End of September
}) //End of October
}

// exports.getVatMonthlyBySectorAllSubsector_old = (req, res, next) => { 
  
//     // var mm = +req.params.mm;
//     var yyyy = +req.params.yyyy;
//     var sector = req.params.sector;

//     firstDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
//     testDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
//     lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

//     console.log('firstDate:' + firstDate);
//     console.log('lastDate: '+ lastDate);
    
//      var sumValue = 0;
//      var dadas = '';
//       Transactionz.aggregate([
//         {
//             $match: {'createdAt': {
//                 $gte: firstDate,
//                 $lte: lastDate}, 'sector': sector}
//         },
//         {
//             $group: {

//                 _id: "$sub_sector",
//                 totalSum: { $sum: "$vat"},
//                 count: { $sum: 1 }
//             }
//         }
//       ]
//       ).then (dat => {

//         // calculate percentage
//         if (dat) {

//             for (i = 0; i < dat.length; i++){
//                 sumValue += dat[i].totalSum;
//             }

//             for (i = 0; i < dat.length; i++) {
//                 var ans = (dat[i].totalSum * 100)/sumValue;
//                 var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
//                 dadas = dadas + tempview;
//             }

//             dadas = dadas.substring(0, dadas.length - 1);
//             dadas = "{" + dadas + "}" ;
//             console.log(dadas);
//             var perc = JSON.parse(dadas);

//         }

//         res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
//       })  .catch(err => {
//         if (!err.statusCode) {
//             err.statusCode = 500;
//         }
//         next(err); // pass the error to the next error handling function
//     })        
       
// }


exports.getVatSegmentYearlyBySector = (req, res, next) => { 
    const today = new Date();
    const yyyy = today.getFullYear();
    var mm = today.getMonth();
    const dd = today.getDate();

    var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

              // Check Previous Year's  transactions
         firstDate.setFullYear(firstDate.getFullYear() - 1);
         lastDate.setFullYear(lastDate.getFullYear() - 1);
         var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
         
         lastDate2.setHours(23,59);
 
         console.log('sDate :' + firstDate);
         console.log('eDate :' + lastDate2);
         
      
 
         const previous = await Transactionz.aggregate([
             {
                 $match: {'createdAt': {
                     $gte: firstDate,
                     $lte: lastDate2}, 'sector': sector}
             },
             {
                 $group: {
     
                     _id: "$sub_sector",
                     totalSum: { $sum: "$vat"},
                     count: { $sum: 1 }
                 }
             }
           ])
         
         
           // calculate percentage change 
           //   Formula
           //   ((newPrice - oldPrice)/oldPrice) * 100
           var percentChange = 0;
           var perc = 0;
           if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
           
           for (i = 0; i < dat.length; i++) {
            if (dat[i] && previous[i]) {
                var ans = ((dat[i].totalSum - previous[i].totalSum) / previous[i].totalSum) * 100;
                var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                    dadas = dadas + tempview;
            }
        }
    
                dadas = dadas.substring(0, dadas.length - 1);
                dadas = "{" + dadas + "}" ;
                console.log(dadas);
                perc = JSON.parse(dadas);
    }
         
         res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: perc});        

        // res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getSectorTransactionzWithPages = (req, res, next) => { 
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    var sector = req.params.sector;


    console.log('Page: ' + page);
    console.log('Limit: ' + limit);
    console.log('Sector:' + sector);
// sector = 'Insurance';
        Transactionz.find({
            $match: {'sector': sector}
        },'trx_id company_name sector trx_type trx_value vat remarks')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Transactionz.count({'sector': sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);
            
            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

// *****END OF SECTORS ******


// *****SUB SECTORS- SEC, NGX, NAICOM etc ******

exports.getVatTodayBySubSector = (req, res, next) => { 
    var subsector = req.params.subsector;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 23, 59, 00));
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatMonthlyBySubSector = (req, res, next) => { 
    var subsector = req.params.subsector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));

    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    lastDayOfMonth.setHours(23,59);

  
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfMonth);
    console.log('lastDate: '+ lastDayOfMonth);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous month's  transaction
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        // lastDate = lastDayOfMonth;
        // var d = new Date(2023, lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
          

        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatQuarterlyBySubSector = (req, res, next) => { 
    var subsector = req.params.subsector;
    
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    let qtrObject = getQuarter(mm, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        // console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Last Qtr's  transaction

        let lastQtrObject = getLastQuarter(mm, yyyy);
        console.log('Last QT bjt:: ' + lastQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) { 
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
        }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatYearlyBySubSector = (req, res, next) => { 
    var subsector = req.params.subsector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous Year's  transactions
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatHourlyBySubSector_old = (req, res, next) => { 
    var hr = req.params.hr;
    var intervalBack = req.params.hrback;
    var subsector = req.params.subsector;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    // var intervalBack = 1;
    console.log('Hr::' + hr + ' min: ' + intervalBack);
    const options = {
        year: '2-digit',
    }
    
    const toTime = new Date(Date.UTC(yyyy, mm, dd, hr, 00, 00));
    var toTime1 = toTime.getTime();
    console.log('Old Time TO:' + toTime);

    toTime1 = new Date(toTime1);  // Add 1hr to care for UK time zone and Nigeria
    fromTime1 = new Date(toTime1 - intervalBack*60*60*1000);

    console.log('From: ' + fromTime1);
    console.log('To: ' + toTime1);

    let sumVat = 0;
        Transactionz.find({'createdAt': {
            $gte: new Date(fromTime1),
            $lte: new Date(toTime1)}, 'sub_sector': subsector}, 'vat trx_value sector sub_sector', (err, vats) => {
                if (err) {
                    return err;
                } else {
                    // calculate summary of vats
                    
                    for (let i = 0; i<vats.length; i++) {
                        sumVat += vats[i].vat;
                        console.log(i + ': ' + vats[i].vat)
                    }
                    res.status(200).json({message: 'success', hourlyVat: sumVat, data: vats});        
                }
            })

}

exports.getVatHourlyBySubSector = (req, res, next) => { 
    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    var subsector = req.params.subsector;

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate.setHours(firstDate.getHours() + 1);
    // lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        if (!dat[0]) dat[0] = 0;


        // 2AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;
       
                // 3AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sub_sector': subsector}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;


                // 4AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
         
             var sumValue = 0;
             var dadas = '';
              Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sub_sector': subsector}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // 5AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // 6AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;
        
        // 7AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // 8AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // 9AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // 10AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        if (!dat9[0]) dat9[0] = 0;


        // 11AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        if (!dat10[0]) dat10[0] = 0;


        
        // 12PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        if (!dat11[0]) dat11[0] = 0;


        // 1PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat12 => {
        if (!dat12[0]) dat12[0] = 0;

        // 2PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        console.log('firstD::' + firstDate);
        console.log('lastD::' + lastDate);
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat13 => {
        if (!dat13[0]) dat13[0] = 0;

        // 3PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat14 => {
        if (!dat14[0]) dat14[0] = 0;

        // 4PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat15 => {
        if (!dat15[0]) dat15[0] = 0;

        // 5PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat16 => {
        if (!dat16[0]) dat16[0] = 0;

        // 6PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat17 => {
        if (!dat17[0]) dat17[0] = 0;

        // 7PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat18 => {
        if (!dat18[0]) dat18[0] = 0;

        // 8PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat19 => {

        if (!dat19[0]) dat19[0] = 0;
        // 9PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat20 => {
        if (!dat20[0]) dat20[0] = 0;

        // 10PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat21 => {
        if (!dat21[0]) dat21[0] = 0;

        // 11PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat22 => {
        if (!dat22[0]) dat22[0] = 0;

        // 12AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat23 => {
        if (!dat23[0]) dat23[0] = 0;


        // let obj = 
        let arrData = [{"1AM": dat, "2AM": dat1, "3AM": dat2, "4AM": dat3, "5AM": dat4, "6AM": dat5, "7AM": dat6,
    "8AM": dat7, "9AM": dat8, "10AM": dat9, "11AM": dat10, "12PM": dat11, "1PM": dat12, "2PM": dat13, "3PM": dat14, 
    "4PM": dat15, "5PM": dat16, "6PM": dat17, "7PM": dat18, "8PM": dat19, "9PM": dat20, "10PM": dat21, "11PM": dat22, "12AM": dat23}];
       
        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 
});
});
});
}); 
}); 
}); 
}); 
});
});
});
});
});
});
});
}

exports.getSubSectorTransactionzWithPages = (req, res, next) => { 
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    var subsector = req.params.subsector;


    console.log('Page: ' + page);
    console.log('Limit: ' + limit);
    // console.log('Sector:' + sector);
// sector = 'Insurance';
        Transactionz.find({
            $match: {'sub_sector': subsector}
        },'trx_id company_name sector trx_type trx_value vat remarks')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Transactionz.count({'sub_sector': subsector});
            

            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}


// 1st, 2nd , 3rd and 4th Qtr summary of reports
exports.getVatQuarter1234BySector = (req, res, next) => { 
    var sector = req.params.sector;
    
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    // 1st Quarter
    let qtrObject = getQuarter(1, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Transactionz.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]).then (async dat => {
        if (!dat[0]) dat[0] = 0;

        // Check 2nd Qtr's transaction

        // let secondQtrObject = getQuarter(3, yyyy);
        // console.log('Last QT bjt:: ' + secondQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(3, yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('2nd qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const secondQtr = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
          if (!secondQtr[0]) secondQtr[0] = 0;

        //   Get the third qtr data
            let qtrObject3 = getQuarter(6, yyyy);
        var firstDate3 = qtrObject3.firstDate;
        var lastDate3 = qtrObject3.lastDate;
        console.log('3rd qtr:' + qtrObject3.qtr);

        console.log('sDate3 :' + firstDate3);
        console.log('eDate3 :' + lastDate3);
        
        const thirdQtr = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate3,
                    $lte: lastDate3}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])

          if (!thirdQtr[0]) thirdQtr[0] = 0;

        //   Get the 4th qtr data
        let qtrObject4 = getQuarter(9, yyyy);
        var firstDate4 = qtrObject4.firstDate;
        var lastDate4 = qtrObject4.lastDate;
        console.log('3rd qtr:' + qtrObject4.qtr);

        console.log('sDate4 :' + firstDate4);
        console.log('eDate4 :' + lastDate4);
        
        const fourthQtr = await Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate4,
                    $lte: lastDate4}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])

          if (!fourthQtr[0]) fourthQtr[0] = 0;
        
        res.status(200).json({message: 'success', firstQuarter: dat, secondQuarter: secondQtr, thirdQuarter: thirdQtr, fourthQuarter: fourthQtr});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getTopPerfomersByYear = (req, res, next) => { 
    var total = +req.params.total;
    var yyyy = +req.params.yyyy;
    
    // const mm = today.getMonth();
    // const dd = today.getDate();
    
    if (!yyyy) {
        const today = new Date();
        yyyy = today.getFullYear();
    }

    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Transactionz.aggregate([
        
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$cac_id",
                
                totalVat: { $sum: "$vat"},
                totalTrxn: { $sum: "$trx_value"},
                count: { $sum: 1 }
            }
        
        }
      ]
      )
      
        .sort('-totalTrxn')
        .then (async dat => {
            // Get total summation for transaction
            const totalVat = await Transactionz.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalVat: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
            ]);

            console.log('Total Vat:' + totalVat[0].totalVat);
            var cac_id;
            var arrData = [];
            var arrOthers = [];
            var records;
            // Get other records
            for (let i = 0; i < dat.length; i++) {
                cac_id = dat[i]._id;
                console.log('cadID '+ i + ': ' + cac_id);
                
                records = await Company.findOne(
                    {'cac_id': cac_id}, 'company_name sector cac_id'
                );
                // arrOthers.push(records);

                // Get percentage of vat contributed
                 var percentContributed = (dat[i].totalVat * 100)/totalVat[0].totalVat;

                console.log('Records:' + records);
                var newDat =  { "totalVat": dat[i].totalVat ,
                                "totalTrxn" : dat[i].totalTrxn,
                                "count": dat[i].count,
                                "company": records.company_name,
                                "sector": records.sector,
                                "cac_id": records.cac_id,
                                "vatPercentContributed": percentContributed.toFixed(1)
                            }
                        arrData.push(newDat)
            
            }

           
        
        //   // calculate percentage change 
        //   //   Formula
        //   //   ((newPrice - oldPrice)/oldPrice) * 100
        //   var percentChange = 0;
        //   if (dat[0] && previous[0]) {
        //     percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
        //     percentChange = percentChange.toFixed(1);
        //   }
        
        res.status(200).json({message: 'success', topPerformer: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}



exports.getNumberOfVatsAllTimes = async (req, res, next) => { 
            const count = await Transactionz.count();

            res.status(200).json({message: 'success', count: count}); 
             
}


exports.getSummaryOfAllTimes = async (req, res, next) => { 

    Transactionz.aggregate([

        {
            $group: {

                _id: "$_v",   
                totalVat: { $sum: "$vat"},
                totalTrxn: { $sum: "$trx_value"},
                count: { $sum: 1 }
            }
        
        }
      ]
      ).then (async dat => {

        const count = await Transactionz.count();
     

    res.status(200).json({message: 'success', totalTrxnAllTimes: dat[0].totalTrxn, totalVatAllTimes: dat[0].totalVat, totalRecords: count }); 
})  .catch(err => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err); // pass the error to the next error handling function
})        

}

// *****SUB SECTORS END******