const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const gasTypeRoutes = require('./gas_type.routes');
const cylinderPropertyRoutes = require('./cylinder_property.routes');
const warehouseRoutes = require('./warehouse.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/gas-types', gasTypeRoutes);
router.use('/cylinder-properties', cylinderPropertyRoutes);
router.use('/warehouses', warehouseRoutes);

router.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = router;
