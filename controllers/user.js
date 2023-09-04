const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Company = require('../models/company');
const Personal = require('../models/personal');
const Tlogs = require ('../models/tlogs');
// const Client = require('../models/client');
// const Driver = require('../models/driver');

// const axios = require('axios');
const crypto = require('crypto');
// const sgMail = require('@sendgrid/mail');
// var twilio = require('twilio');
// var accountSid = 'AC8b8e8b58212ca0f55d31161028233ca0'; // Your Account SID from www.twilio.com/console
// var authToken = '52c4b42787a46cf02889279ec0eb430f';   // Your Auth Token from www.twilio.com/console
// var client = new twilio(accountSid, authToken);

// sgMail.setApiKey("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");

let msgTitle;
let msgBody;

// let sendSMS = (mTitle, mMsg, mDestination) => {
// 	console.log('GOt to MESSging');
// 	// SEND SMS WITH NUOBJECT

// 	axios.get('https://cloud.nuobjects.com/api/send/?', {
// 		params: {
// 			user: 'anthony1',
// 			pass: 'anthony123',
// 			to: mDestination,
// 			from: mTitle,
// 			msg: mMsg

// 		}
//     });
    

// // Mobivate SMS uk
//     // https://app.mobivatebulksms.com/gateway/api/simple/MT?USER_NAME=anthosey@gmail.com&PASSWORD=aalsz&ORIGINATOR=Testing&RECIPIENT=2348038094457&ROUTE=mglobal&MESSAGE_TEXT=Your+PIN+is+654321
//     axios.get('https://app.mobivatebulksms.com/gateway/api/simple/MT?', {
//         params: {
//             USER_NAME: 'anthosey@gmail.com',
//             PASSWORD: 'Anthos123',
//             ORIGINATOR: mTitle,
//             RECIPIENT: mDestination,
//             ROUTE: 'mglobal',
//             MESSAGE_TEXT: mMsg
//         }
//     });
//     // ENd Mobivate

//     //**** SEND MSG WITH TWILIO */
			
		
// 			// var msg ="We have received your booking. Ref: " + jobRef ;
// 			// client.messages.create({
// 			// 	body: msg,
// 			// 	to: '+2348038094457',  // Text this number
// 			// 	from: '+19382009730' // From a valid Twilio number
// 			// 	// from: 'Alaaru' This will be possible when the twilio account is upgraded
// 			// })
// 			// .then((message) => console.log(message.sid))
// 			// .catch(err => {
// 			// 	console.log('Twilio Error: ' + err);
// 			// });

// 	// ***** END OF TWILIO *******

// }

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

function getEmail(msgTitle, msgBody){

	var data = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html xmlns="http://www.w3.org/1999/xhtml">
	 <head>
	  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	  <title>Alaaru Logistics Services</title>
	  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	</head>
	<body style="margin: 0; padding: 0; font-family:verdana;" bgcolor="#f9fafb">
		 <table border="0" cellpadding="0" cellspacing="0" width="100%">
			<tr>
			<td>
				
			<table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
				<!-- Title Starts here -->
				<tr>
					<td align="center" bgcolor="#000000" style="padding: 20px 0 10px 0;">
						<img src="https://alaaru.herokuapp.com/images/logo_small.jpg" alt="Alaaru Logistics Services" width="100" height="100" style="display: block;" />
					</td>
				</tr>
			<!-- Title Ends here -->
			
			<!-- Body Starts here -->
				   <tr>
					<td bgcolor="#e9ecef" style="padding: 40px 20px 30px 20px;">
						<table border="0" cellpadding="0" cellspacing="0" width="100%">
								<!-- Message Title Starts here -->
							<tr>
							 <td style="font-size:25px; color:#f86c3a">
								${msgTitle}
							 </td>
							</tr>
								<!-- Message Title Ends here -->

								<!-- Message Content Starts here -->
							<tr>
							 <td style="padding: 20px 0 30px 0; font-size:18px; color:#000000">
							 ${msgBody}
							 </td>
							</tr>
								<!-- Message contents End here -->
							
						   </table>
					</td>
				   </tr>
				<!-- Body Ends here -->
				<tr>
				<td bgcolor="#f48942" style="padding: 20px 15px 20px 15px;">
					<table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px">
						<tr>
							<td width="52%" style="vertical-align:top">
									<table style="font-size:14px">
											<tr>
												<td><b><p style="color:#DA251C;">Contact us:</p></b></td>
												</tr>
												<tr>
													<td>
														M: 23481-8320-9657
													</td>
												</tr>
												<tr>
													 <td>
															W: www.alaaru.de
														</td>
													</tr>
													<tr>
														<td>
															E: callnow@alaaru.de
														</td>
													</tr>
									</table>

							  
							   </td>
						 <td align="right" style="vertical-align:top">
							<table border="0" cellpadding="0" cellspacing="0">
								
							 <tr><td>
								 <table style="font-size:14px">
									<tr>
										<td>
												<p style="color:#DA251C; font-weight:bold;">Social media</p>
												<a href="http://www.facebook.com/alaarulogistics" target ="_blank" >
													<img src="https://alaaru.herokuapp.com/images/facebook.png" alt="facebook" style="padding-left:0px;" /></a>
														<a href="http://www.twitter.com/alaarulogistics" target ="_blank" >
															<img src="https://alaaru.herokuapp.com/images/twitter.png" alt="Twitter" style="padding-left:0px;" /></a>
																<a href="http://www.instagram.com/alaarulogistics" target ="_blank" >
																	<img src="https://alaaru.herokuapp.com/images/instagram.png" alt="Instagram" style="padding-left:0px;" /></a>
																		
										</td>
									</tr>
										
								 </table>
							 </td></tr>
							</table>
						   </td>
						</tr>
					   </table>
				</td>
			   </tr>
			   
			   <tr><td style="text-align:center;">
					<a href="#">Terms of Service</a><br/>
					&copy;2020 Alaaru Logistics Limited.
			   </td></tr>
		</table>
		
		</td>
		</tr>
	 </table>
</body>

</html>`
	return data;
}

// User Logins
exports.getUsers = (req, res, next) => { 
    // console.log('Filter:: ' + tempFilter);
        User.find()
        .then(users => {
            res.status(200).json({message: 'success', data: users});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

exports.getOneUser = (req, res, next) => {
    const email = req.params.username;
    console.log('Email: ' + email);
    User.findOne({email: email})
    .then(user => {
        console.log(JSON.stringify(user));
        res.status(200).json(user);
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.createUser = (req, res, next) => {
    // const tk =  generateToken(6);
    // console.log('Tk::' + tk);
    // return;

    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Generate a unique id for token

    token = generateToken(6);
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;
    const usertype = req.body.usertype;
    const status = 'unverified';
    // const rating = 5;

    var hashedPasskeys;

    // Create secure hash password with bcrypt

    bcrypt.hash(password, 12)
    .then( hashPassword => {
        hashedPasskeys = hashPassword;
        bcrypt.hash(token, 12)
        .then (hashedToken => {

            const user = new User({
                firstname: firstname,
                lastname: lastname,
                email: email,
                mobile: mobile,
                password: hashedPasskeys,
                usertype: usertype,
                status: status,
                // wallet: wallet,
                accountActivationToken: hashedToken
                
            });
            
            return user.save()
    
        })

    })
    .then(async user => {

        // Trail log action
        // const tlogs = new Tlogs({
        //     email: email,
        //     name: user.firstname,
        //     action: 'New user created, user name:' + user.firstname + ', lastName: ' + user.lastname + ', Email: ' + user.email
            
        // });
        
        // await tlogs.save();
        // console.log('Log  created successfully!');

        // Send SMS
        // msg = `Your alaaru account activation Code is: ${token}`;
        // sendSMS('Alaaru', msg, mobile)
            
        // // Send email
        // const htmlMsg = getEmail('Your Alaaru activation code:',   `Your alaaru activation code is: ${token}`);
        // const message = {         
        //     to: email,
        //     from: 'donotreply@alaaru.de',
        //     subject: 'Alaaru activation code',
        //     // text: "You are wlecome to alaaru Logistics service:",
        //     html: htmlMsg,
        //   };
        //   return sgMail.send(message)
        //   .then(mailResponse => {
              
        //     return ({mail: mailResponse[0].statusCode, email: driver.email, mobile: driver.mobile});
            
        //   })  //end of sendMail
            
    // })  //End of save driver
    //End of password hash
    // .then(alldata =>{
        res.status(201).json({
            message: 'account created successfully',
            data: {firstname: firstname, lastname: lastname, email: email, mobile: mobile}
        });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });    
}


exports.userLogin = (req, res, next) => {
    console.log('Processing starts..');
    const email = req.body.username;
    const mobile = req.body.username;
    const password = req.body.password
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
        if (!user) {
            const error = new Error('Incorrect username or password!')
            error.statusCode = 401;
            throw error;
            return User.findOne({mobile: mobile});
        }
        return user;
    })
    .then(user => {
        console.log('the User:' + user);
        if (!user) {
            const error = new Error('Incorrect username or password!')
            error.statusCode = 401;
            throw error;
        }

        // Check if account is active
        if (user.status === 'unverified') {
            const error = new Error('Your account is not verified yet, please contact administrator')
            error.statusCode = 405;
            throw error;
        }


        if (user.status === 'Deactivated') {
            const error = new Error('Account deactivated, please contact your administrator.')
            error.statusCode = 406;
            throw error;

        }

        // return user;
        loadedUser = user;
        return bcrypt.compare(password, user.password)
    })
        
        .then(async passEqual => {
            if (!passEqual) {
                const error = new Error('Incorrect password or username')
                error.statusCode = 401;
                throw error;
            }

                // Trail log action
                const tlogs = new Tlogs({
                    email: email,
                    name: loadedUser.firstname,
                    action: 'Logged in successfully'
                    
                });
                
                await tlogs.save();
                console.log('Log  created successfully!');

    
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                }, 
                process.env.KOKORO_IWOLE,
                {expiresIn: '1h'}
                
            );
          
            return res.status(200).json({token: token, 
                                        // userId: loadedUser._id.toString(),
                                        email: loadedUser.email, 
                                        expiryHours: 1, 
                                        mobile: loadedUser.mobile,
                                        firstname: loadedUser.firstname,
                                        userType: loadedUser.usertype
                                        // contactAddress: loadedUser.contactAddress,
                                     });
        })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });
}


// exports.getCountryCodes = (req, res, next) => {
//         const countryCode = req.params.code;
//                 switch(countryCode) {
//                     // Africa
//                   case 'NG':
//                     res.status(200).json({message: 'success', data: {country: 'Nigeria', dialCode: 234, shortCode: 'NG', countryFlag:'ng.svg'}});
//                     break;
//                   case 'DZ':
//                     res.status(200).json({message: 'success', data: { country: 'Algeria', dialCode: 213, shortCode: 'DZ', countryFlag:''}});
//                     break;
//                   case 'BJ':
//                     res.status(200).json({message: 'success', data: { country: 'Benin', dialCode: 229, shortCode: 'BJ', countryFlag:''}});
//                     break;
//                   case 'BW':
//                     res.status(200).json({message: 'success', data: { country: 'Botswana', dialCode: 267, shortCode: 'BW', countryFlag:''}});
//                     break;
//                   case 'GH':
//                     res.status(200).json({message: 'success', data: { country: 'Ghana', dialCode: 233, shortCode: 'GH', countryFlag:''}});
//                   break;
//                   case 'CM':
//                     res.status(200).json({message: 'success', data: { country: 'Cameroon', dialCode: 237, shortCode: 'CM', countryFlag:''}});
//                     break;
//                   case 'TD':
//                     res.status(200).json({message: 'success', data: { country: 'Chad', dialCode: 235, shortCode: 'TD', countryFlag:''}});
//                     break;
//                   case 'CD': 
//                   res.status(200).json({message: 'success', data: { country: 'Democratic Republic of Congo', dialCode: 243, shortCode: 'CD', countryFlag:''}});
//                     break;
        
//                     case 'BF': 
//                     res.status(200).json({message: 'success', data: { country: 'Burkina Faso', dialCode: 226, shortCode: 'BF', countryFlag:''}});
//                       break;
//                       case 'BI': 
//                   res.status(200).json({message: 'success', data: { country: 'Burundi', dialCode: 257, shortCode: 'BI', countryFlag:''}});
//                     break;
//                     case 'CV': 
//                   res.status(200).json({message: 'success', data: { country: 'Cape Verde', dialCode: 238, shortCode: 'CV', countryFlag:''}});
//                     break;
//                     case 'CF': 
//                   res.status(200).json({message: 'success', data: { country: 'Central African Republic', dialCode: 236, shortCode: 'CF', countryFlag:''}});
//                     break;
//                     case 'KM': 
//                   res.status(200).json({message: 'success', data: { country: 'Comoros', dialCode: 269, shortCode: 'KM', countryFlag:''}});
//                     break;
//                     case 'DJ': 
//                   res.status(200).json({message: 'success', data: { country: 'Djibouti', dialCode: 253, shortCode: 'DJ', countryFlag:''}});
//                     break;
//                     case 'EG': 
//                   res.status(200).json({message: 'success', data: { country: 'Egypt', dialCode: 20, shortCode: 'EG', countryFlag:''}});
//                     break;
//                     case 'GQ': 
//                   res.status(200).json({message: 'success', data: { country: 'Equatorial Guinea', dialCode: 240, shortCode: 'GQ', countryFlag:''}});
//                     break;
//                     case 'ER': 
//                   res.status(200).json({message: 'success', data: { country: 'Eritrea', dialCode: 291, shortCode: 'ER', countryFlag:''}});
//                     break;
//                     case 'ET': 
//                   res.status(200).json({message: 'success', data: { country: 'Ethiopia', dialCode: 251, shortCode: 'ET', countryFlag:''}});
//                     break;
//                     case 'GA': 
//                   res.status(200).json({message: 'success', data: { country: 'Gabon', dialCode: 241, shortCode: 'GA', countryFlag:''}});
//                     break;
//                     case 'GM': 
//                   res.status(200).json({message: 'success', data: { country: 'Gambia', dialCode: 220, shortCode: 'GM', countryFlag:''}});
//                     break;
//                     case 'GN': 
//                   res.status(200).json({message: 'success', data: { country: 'Guinea', dialCode: 244, shortCode: 'GN', countryFlag:''}});
//                     break;
//                     case 'GW': 
//                   res.status(200).json({message: 'success', data: { country: 'Guinea-Bissau', dialCode: 245, shortCode: 'GW', countryFlag:''}});
//                     break;
//                     case 'CI': 
//                   res.status(200).json({message: 'success', data: { country: 'Ivory Coast', dialCode: 225, shortCode: 'CI', countryFlag:''}});
//                     break;
//                     case 'KE': 
//                   res.status(200).json({message: 'success', data: { country: 'Kenya', dialCode: 254, shortCode: 'KE', countryFlag:''}});
//                     break;
//                     case 'LS': 
//                   res.status(200).json({message: 'success', data: { country: 'Lesotho', dialCode: 266, shortCode: 'LS', countryFlag:''}});
//                     break;
//                     case 'LR': 
//                   res.status(200).json({message: 'success', data: { country: 'Liberia', dialCode: 231, shortCode: 'LR', countryFlag:''}});
//                     break;
//                     case 'LY': 
//                   res.status(200).json({message: 'success', data: { country: 'Libya', dialCode: 218, shortCode: 'LY', countryFlag:''}});
//                     break;
//                     case 'MG': 
//                   res.status(200).json({message: 'success', data: { country: 'Madagascar', dialCode: 261, shortCode: 'MG', countryFlag:''}});
//                     break;
        
        
//                     // America (North and South)
//                   case 'US':
//                     res.status(200).json({message: 'success', data: { country: 'United States', dialCode: 1 , shortCode: 'US', countryFlag:'us'}});
//                   break;
//                 //   Europe
//                   case 'IE':
//                     res.status(200).json({message: 'success', data: { country: 'Ireland', dialCode: 353, shortCode: 'IE', countryFlag:''}});
//                     break;
              
//                     case 'GB':
//                         res.status(200).json({message: 'success', data: { country: 'United Kingdom', dialCode: 44, shortCode: 'GB', countryFlag:''}});
//                     break;
                    
//                 default:
//         res.status(200).json({message: 'Not found'});
//     }
// }
        

exports.forgotPassword = (req, res, next) => {
    const email = req.body.username;
    const mobile = req.body.username;
    var token;
            
    let loadedUser;
        User.findOne({email: email})
            .then(user => {
                if (!user) {
                    // const error = new Error('Incorrect username or password!')
                    // error.statusCode = 401;
                    // throw error;
                    return User.findOne({mobile: mobile});
                }
                return user;
            })
            .then(user => {
                if (!user) {
                    const error = new Error('Username does not exist!')
                    error.statusCode = 401;
                    throw error;
                }
                token = generateToken(6);
                console.log('Token: ' + token);
                loadedUser = user;
                return bcrypt.hash(token, 12)
                // return loadedUser;
            })
                
                .then(hashedToken => {
                    if (!hashedToken) {
                        const error = new Error('Could not encrypt the token generated')
                        error.statusCode = 401;
                        throw error;
                    }
                    // let token expire in 15 minutes
                    // const expiryTime = this.setExpiryTime(15);
        
                    var d = new Date();
                    d.setMinutes( d.getMinutes() + 15 );
        
                    loadedUser.passwordResetToken = hashedToken;
                    loadedUser.passwordResetTokenExpiy = d;
                    return loadedUser.save()
                    
                })
                .then (updatedUser => {
        
                    // Send email
                    const htmlMsg = getEmail('T-Sentinel password reset token:',  `Your password reset token is: ${token}`, 'If you have not requested for a password reset, please disregard and change your password immediately.');
                    const message = {         
                        to: loadedUser.email,
                        from: 'donotreply@mail.domain',
                        subject: 'T-Sentinel Password Reset Token',
                        // text: "You are wlecome to alaaru Logistics service:",
                        html: htmlMsg,
                      };
                      return sgMail.send(message)
                      .then(mailResponse => {
                          
                        return ({mail: mailResponse[0].statusCode});
                        
                      })  //end of sendMail
        
                })
                .then(emailSent => {
                    return res.status(200).json({message: 'Token registered successfully', token: token, email: loadedUser.email});
                })
                .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
            }
        
        
exports.confirmToken = (req, res, next) => {
    
            const email = req.body.username;
            const mobile = req.body.username;
            const token = req.body.token;        
            console.log(email, mobile, token);
            // return; 

            let loadedUser;
            User.findOne({email: email})
                .then(user => {
                    if (!user) {
                        
                        return User.findOne({mobile: mobile});
                    }
                    // console.log(JSON.stringify(user));
                    // return;
                    return user;
                })
                .then(user => {
                    // console.log(JSON.stringify(user));
                    if (!user) {
                        const error = new Error('Username does not exist!')
                        error.statusCode = 401;
                        throw error;
                    }
                    // token = generateToken(6);
                    loadedUser = user;
                    console.log('Tken::' + token);
                    console.log('dt Token::' + user.passwordResetToken);
                    return bcrypt.compare(token, user.passwordResetToken)
                    // return loadedUser;
                })
                    
                .then(tokenMatch => {
                    console.log('BCRY Compare::' + tokenMatch);
                if (!tokenMatch) {
                    const error = new Error('Invalid Token')
                    error.statusCode = 401;
                    throw error;
                }
                        // let token expire in 15 minutes
                    //     console.log('HTken::' + hashedToken);
                    //     loadedUser.passwordResetToken = hashedToken;
                    //     loadedUser.passwordResetTokenExpiy = this.setExpiryTime(15);
                    //     return loadedUser.save()
                        
                    // })
                    // .then (updatedUser => {
            return res.status(200).json({message: 'Password reset approved', token: token});
            })
            .catch(err => {
            if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); // pass the error to the next error handling function
    });
}
        
        
exports.resetPassword = (req, res, next) => {
    const email = req.body.username;
    const mobile = req.body.username;
    const password = req.body.password;
    var token;
                    
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
        if (!user) {
            // const error = new Error('Incorrect username or password!')
            // error.statusCode = 401;
                            // throw error;
                            return User.findOne({mobile: mobile});
                        }
                        return user;
                    })
                    .then(user => {
                        if (!user) {
                            const error = new Error('Username does not exist!')
                            error.statusCode = 401;
                            throw error;
                        }
                        // token = generateToken(6);
                        loadedUser = user;
                        return bcrypt.hash(password, 12)
                        // return loadedUser;
                    })
                        
                        .then(hashedPassword => {
                            if (!hashedPassword) {
                                const error = new Error('Server error occured with password')
                                error.statusCode = 401;
                                throw error;
                            }
                            // let token expire in 15 minutes
                            
                            loadedUser.password = hashedPassword;
                            return loadedUser.save()
                            
                        })
                    .then (updatedUser => {
                    return res.status(200).json({message: 'Password changed successfully'});
                })
                .catch(err => {
                if (!err.statusCode) {
                err.statusCode = 500;
            }
        next(err); // pass the error to the next error handling function
    });
}
        
        
exports.confirmEmailToken = (req, res, next) => {
    const email = req.body.username;
    const mobile = req.body.username;
    const token = '' + req.body.token;        
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
    if (!user) {
    // const error = new Error('Incorrect username or password!')
    // error.statusCode = 401;
    // throw error;
    return User.findOne({mobile: mobile});
    }
    return user;
    })
    .then(user => {
        if (!user) {
        const error = new Error('Username does not exist!')
        error.statusCode = 401;
            throw error;
        }
        // token = generateToken(6);
        loadedUser = user;
        console.log('Tken::' + token);
        return bcrypt.compare(token, user.accountActivationToken)
        // return loadedUser;
        })
                                        
        .then(tokenMatch => {
            if (!tokenMatch) {
                const error = new Error('Invalid Token')
                error.statusCode = 401;
                throw error;
            }
                                            
            loadedUser.status = 'Active';
            loadedUser.emailConfirmed = 'Yes';
                return loadedUser.save();        
            })
            .then(user => {
            console.log('account status updated!');
            return res.status(200).json({message: 'Account confirmation succeeded', token: token});
            })
            .catch(err => {
            if (!err.statusCode) {
            err.statusCode = 500;
            }
        next(err); // pass the error to the next error handling function
    });
}
        
exports.confirmMobileToken = (req, res, next) => {
    const email = req.body.username;
    const mobile = req.body.username;
    const token = '' +req.body.token;        
    let loadedUser;
    User.findOne({email: email})
        .then(user => {
        if (!user) {
        // const error = new Error('Incorrect username or password!')
        // error.statusCode = 401;
        // throw error;
            return User.findOne({mobile: mobile});
        }
            return user;
    })
    .then(user => {
    if (!user) {
    const error = new Error('Username does not exist!')
    error.statusCode = 401;
        throw error;
    }
    // token = generateToken(6);
        loadedUser = user;
        console.log('Tken::' + token);
        return bcrypt.compare(token, user.accountActivationToken)
        // return loadedUser;
    })
                                        
    .then(tokenMatch => {
        if (!tokenMatch) {
            const error = new Error('Invalid Token')
            error.statusCode = 401;
            throw error;
        }
                                            
        loadedUser.accountStatus = 'Active';
        loadedUser.mobileConfirmed = 'Yes';
            return loadedUser.save();        
            })
            .then(user => {
                console.log('account status updated!');
                    return res.status(200).json({message: 'Account confirmation succeeded', token: token});
                })
                .catch(err => {
                    if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
        });
    }
        

exports.generateTokenToEmail = (req, res, next) => {
            const email = req.body.username;
            const mobile = req.body.username;
            var token;
                    
            let loadedUser;
            User.findOne({email: email})
                .then(user => {
                    if (!user) {
                            // const error = new Error('Incorrect username or password!')
                            // error.statusCode = 401;
                            // throw error;
                            return User.findOne({mobile: mobile});
                        }
                        return user;
                    })
                    .then(user => {
                        if (!user) {
                            const error = new Error('Username does not exist!')
                            error.statusCode = 401;
                            throw error;
                        }
                        
                        token = generateToken(6);
                        loadedUser = user;
                        console.log('Email Token:: ' + token);
                        return bcrypt.hash(token, 12)
                        // return loadedUser;
                    })
                        
                        .then(hashedToken => {
                            if (!hashedToken) {
                                const error = new Error('Server error occured with Token encryption')
                                console.log('Server error occured with Token encryption');
                                error.statusCode = 401;
                                throw error;
                            }
                            // let token expire in 15 minutes
                            
                            loadedUser.accountActivationToken = hashedToken;
                            return loadedUser.save()
                            
                        })
                        .then (updatedUser => {
                            // Send Email to user
                                const htmlMsg = getEmail('T-Sentinel Account Verification:',  `Your T-Sentinel account verification token is: ${token}`, 'If you have not attempted to register with us, please disregard this message.');
                                const message = {         
                                    to: loadedUser.email,
                                    from: 'donotreply@mail.domain',
                                    subject: 'T-Sentinel Email Verification',
                                    // text: "You are wlecome to alaaru Logistics service:",
                                    html: htmlMsg,
                                };
                                return sgMail.send(message)
                                .then(mailResponse => {
                                    
                                    return ({mail: mailResponse[0].statusCode});
                                    
                                })  //end of sendMail
        
                        })
                        .then(emailSent => {
                            return res.status(200).json({message: 'Token sent successfully'});
                    })
                    .catch(err => {
                    if (!err.statusCode) {
                    err.statusCode = 500;
                }
            next(err); // pass the error to the next error handling function
        });
    }

exports.changePassword = (req, res, next) => {
        const email = req.body.username;
        const mobile = req.body.username;
        const oldPass = req.body.oldpass;
        const newPass = req.body.newpass;
        
        let loadedUser;
        User.findOne({email: email})
        .then(user => {
            if (!user) {
                // const error = new Error('Incorrect username or password!')
                // error.statusCode = 401;
                // throw error;
                return User.findOne({mobile: mobile});
            }
            return user;
        })
        .then(user => {
            if (!user) {
                const error = new Error('Incorrect username or password!')
                error.statusCode = 401;
                throw error;
            }
    
            // Check if account is active
            if (user.status === 'unverified') {
                const error = new Error('Account awaiting verification')
                error.statusCode = 405;
                throw error;
            }
    
            if (user.status === 'Deactivated') {
                const error = new Error('Account deactivated')
                error.statusCode = 406;
                throw error;
            }
    
            // return user;
            loadedUser = user;
            return bcrypt.compare(oldPass, user.password)
        })
            
            .then(passEqual => {
                if (!passEqual) {
                    const error = new Error('Incorrect password or username')
                    error.statusCode = 401;
                    throw error;
                }
        
                return bcrypt.hash(newPass, 12)

            })
            .then(hasshedPas => {
                if (!hasshedPas) {
                    const error = new Error('Unable to save new password')
                    error.statusCode = 401;
                    throw error;
                }

                loadedUser.password = hasshedPas;
                return loadedUser.save()
                
            })
            .then(updatedUser => {
            return res.status(200).json({message: 'Password changed successfully', user: updatedUser});

        })
    .catch(err => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
next(err); // pass the error to the next error handling function
});
}

exports.lockunlock = (req, res, next) => {
    const email = req.body.email;
    const newStatus = req.body.newstatus;
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
        
        
        if (!user) {
            const error = new Error('Incorrect username or password!')
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;

            loadedUser.status = newStatus;
            return loadedUser.save()
            
        })
        .then(updatedUser => {
        return res.status(200).json({message: 'User status updated successfully', user: updatedUser});

    })
.catch(err => {
if (!err.statusCode) {
    err.statusCode = 500;
}
next(err); // pass the error to the next error handling function
});
}

exports.uploadPassport = (req, res, next) => {
    const email = req.body.username;
    const mobile = req.body.username;
    // const userCateg = req.body.userCateg;
    
    
    // Validate picture
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;

    // End picture validation
    let loadedUser;
    Company.findOne({email: email})
    .then(user => {
        if (!user) {
            return Personal.findOne({email: email});
        }
        return user;
    })
    .then(user => {
        if (!user) {
            const error = new Error('Incorrect user')
            error.statusCode = 401;
            throw error;
        }

        loadedUser = user;
        user.image_url = imageUrl
        return user.save()
    })
    .then(updatedUser => {
        return res.status(200).json({message: 'Passport updated successfully', user: updatedUser});

    })
.catch(err => {
if (!err.statusCode) {
    err.statusCode = 500;
}
next(err); // pass the error to the next error handling function
});
}

// End of User operations

