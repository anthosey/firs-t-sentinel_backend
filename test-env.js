console.log('Current Directory:', __dirname);

// Print all environment variables before loading dotenv
console.log('Before dotenv:', JSON.stringify(process.env, null, 2));

const path = require('path');
const dotenv = require('dotenv');
const result = dotenv.config({ path: path.resolve(__dirname, 'envVar.env') });

// Check for errors in loading dotenv
if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('.env file loaded successfully');
}

// Print all environment variables after loading dotenv
console.log('After dotenv:', JSON.stringify(process.env, null, 2));

// Print specific variables
console.log('MY_VARIABLE:', process.env.MY_VARIABLE);
console.log('ANOTHER_VARIABLE:', process.env.ANOTHER_VARIABLE);
console.log('my_DB: ', process.env.DB_CONNECTION);