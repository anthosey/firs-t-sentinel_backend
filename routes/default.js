const express = require('express');
const defaultController = require('../controllers/default');
// const userController = require ('../controllers/user');
const router = express.Router();
const { body } = require('express-validator');

// GET test api
router.get('/', defaultController.getTest);

router.get('/db', defaultController.getTestDb);
router.get('/db2', defaultController.getUser);
// router.get('/users', defaultController.getUsers);

module.exports = router;