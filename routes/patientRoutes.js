const express = require('express');
const bcrypt = require('bcrypt');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);
// ... other routes for CRUD operations

module.exports = router;