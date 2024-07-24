const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');



const result = dotenv.config({ path: path.resolve(__dirname, 'envVar.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// End of testing

const apiUrl = process.env.TAXPRO_HOSTNAME_LIVE;
const email = process.env.TAXPRO_EMAIL_LIVE;
const password = process.env.TAXPRO_PASSWORD_LIVE;


async function login() {
  try {
    const response = await axios.post(apiUrl, {
      email: email,
      password: password,
      
    // }, {
    //   proxy: {
    //     host: 'proxy-server.example.com',
    //     port: 8080,
    //     auth: {
    //       username: 'proxy-username',
    //       password: 'proxy-password'
    //     }
    //   }
    });
    console.log('Login successful:', response.data);
    console.log('Login successful:', response.data.token);
  } catch (error) {
    console.error('Error logging in:', error.message);
    console.error('Error details:', error);
  }
}

login();