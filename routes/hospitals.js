

const express = require('express');
const {getHospitals,getHospital,createHospitals,updateHospitals,deleteHospitals} = require('../controllers/hospitals');

const appointmentRouter = require('./appointments');

const router = express.Router();
router.use('/:hospitalId/appointments', appointmentRouter);

const {protect , authorize} = require('../middleware/auth');
router.route('/').get(getHospitals).post(protect,authorize('admin'),createHospitals);
router.route('/:id').get(getHospital).put(protect,authorize('admin'),updateHospitals).delete(protect,authorize('admin'),deleteHospitals);



module.exports = router;