const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticateJWT, authorizePermission } = require('../middlewares/auth.middleware');
const {
  createOrderValidation,
  updateOrderStatusValidation,
  getOrdersQueryValidation,
  recommendCylindersValidation,
  assignCylinderValidation,
  markOrderPreparedValidation,
  reassignWarehouseValidation,
  validateCylindersForOrderItemValidation,
  assignAllCylindersToOrderValidation,
  cancelOrderValidation,
} = require('../validators/order.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { param } = require('express-validator');

const router = express.Router();

// --- Sales Operations ---
// Sales membuat order baru
router.post('/', authenticateJWT, authorizePermission('order:create'), createOrderValidation, handleValidationErrors, orderController.createOrder);

// Sales/Admin melihat daftar order
router.get('/', authenticateJWT, authorizePermission('order:view_all'), getOrdersQueryValidation, handleValidationErrors, orderController.getAllOrders); // atau 'order:view_own' untuk sales

// Sales/Admin/Petugas Gudang melihat detail satu order
router.get('/:id', authenticateJWT, authorizePermission('order:view_detail'), [param('id').isInt({ gt: 0 })], handleValidationErrors, orderController.getOrderById);

// Sales/Admin mengubah status order
router.put('/:id/status', authenticateJWT, authorizePermission('order:update_status'), updateOrderStatusValidation, handleValidationErrors, orderController.updateOrderStatuses);

// --- Warehouse Operations ---
// Petugas Gudang mendapatkan daftar order yang perlu disiapkan
router.get('/warehouse/to-prepare', authenticateJWT, authorizePermission('warehouse:view_orders_to_prepare'), orderController.getOrdersToPrepare);

// Mendapatkan rekomendasi tabung untuk item order tertentu
router.get('/warehouse/orders/:order_id/items/:item_id/recommend-cylinders', authenticateJWT, authorizePermission('warehouse:recommend_cylinders'), recommendCylindersValidation, handleValidationErrors, orderController.recommendCylinders);

// Petugas Gudang menetapkan tabung fisik spesifik untuk sebuah OrderItem
router.post('/warehouse/order-items/:item_id/assign-cylinder', authenticateJWT, authorizePermission('warehouse:assign_cylinder_to_order_item'), assignCylinderValidation, handleValidationErrors, orderController.assignCylinderToOrderItem);

// Petugas Gudang menandai bahwa semua item dalam order sudah disiapkan
router.put('/warehouse/orders/:order_id/mark-prepared', authenticateJWT, authorizePermission('warehouse:mark_order_prepared'), markOrderPreparedValidation, handleValidationErrors, orderController.markOrderPrepared);

router.put('/:id/reassign-warehouse', authenticateJWT, authorizePermission('order:reassign_warehouse'), reassignWarehouseValidation, handleValidationErrors, orderController.reassignWarehouse);

router.post(
  '/warehouse/order-items/:item_id/validate-cylinders',
  authenticateJWT,
  authorizePermission('warehouse:validate_cylinder_for_order'),
  validateCylindersForOrderItemValidation,
  handleValidationErrors,
  orderController.validateCylindersForOrderItem
);

router.post(
  '/warehouse/orders/:order_id/assign-all-cylinders',
  authenticateJWT,
  authorizePermission('warehouse:assign_all_cylinders_to_order'),
  assignAllCylindersToOrderValidation,
  handleValidationErrors,
  orderController.assignAllCylindersToOrder
);

router.put(
  '/:id/cancel',
  authenticateJWT,
  authorizePermission('order:cancel'), 
  cancelOrderValidation,
  handleValidationErrors,
  orderController.cancelOrder
);

module.exports = router;
