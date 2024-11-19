const express = require('express');
const { authCheck } = require('../middlewares/authCheck');
const router = express.Router();
const {changeOrderStatus,getOrdersAdmin} = require('../controllers/admin');

router.put('/admin/order-status', authCheck,changeOrderStatus);
router.get('/admin/orders',authCheck,getOrdersAdmin); 

module.exports = router;