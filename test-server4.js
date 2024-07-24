require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const path = require('path');
const dotenv = require('dotenv');


const result = dotenv.config({ path: path.resolve(__dirname, 'envVar.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}


const apiUrl = process.env.TAXPRO_HOSTNAME_LIVE;
const email = process.env.TAXPRO_EMAIL_LIVE;
const password = process.env.TAXPRO_PASSWORD_LIVE;



async function login() {
    console.log('url:' + apiUrl);
  try {
    const data = qs.stringify({
      email: email,
      password: password
    //   grant_type: grant_type
    });

    const response = await axios.post(apiUrl, data, {
      headers: {
        // 'Content-Type': 'application/x-www-form-urlencoded'
        'Content-Type': 'application/json',

      }
    });

    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Error logging in:', error.message);
    console.error('Error details:', error);
  }
}

login();