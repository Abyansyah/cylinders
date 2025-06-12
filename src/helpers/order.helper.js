'use strict';
const { Order, OrderStatusHistory } = require('../models');

const updateOrderStatus = async (orderId, newStatus, userId, notes = null, transaction = null) => {
  const order = await Order.findByPk(orderId, { transaction });
  if (!order) {
    throw new Error('Order not found for status update.');
  }
  order.status = newStatus;
  await order.save({ transaction });

  await OrderStatusHistory.create(
    {
      order_id: orderId,
      status: newStatus,
      created_by_user_id: userId,
      notes,
      timestamp: new Date(),
    },
    { transaction }
  );

  return order;
};

module.exports = {
  updateOrderStatus,
};
