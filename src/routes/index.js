const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const gasTypeRoutes = require('./gas_type.routes');
const cylinderPropertyRoutes = require('./cylinder_property.routes');
const permissionRoutes = require('./permission.routes');
const warehouseRoutes = require('./warehouse.routes');
const cylinderRoute = require('./cylinder.routes');
const stockMovementRoutes = require('./stock_movement.routes');
const customerRoutes = require('./customer.routes');
const orderRoutes = require('./order.routes');
const deliveryRoutes = require('./delivery.routes');
const returnedCylinderRoutes = require('./returned_cylinder.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/gas-types', gasTypeRoutes);
router.use('/cylinder-properties', cylinderPropertyRoutes);
router.use('/permissions', permissionRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/cylinders', cylinderRoute);
router.use('/stock-movements', stockMovementRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/returns', returnedCylinderRoutes);

router.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = router;
