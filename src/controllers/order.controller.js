const { Order, OrderItem, OrderItemAssignment, Customer, User, Cylinder, CylinderProperty, GasType, StockMovement, Warehouse, Product, sequelize } = require('../models');
const { Op, literal } = require('sequelize');
const { updateOrderStatus } = require('../helpers/order.helper');

const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const prefix = `O${year}${month}${day}-`;
  const lastOrder = await Order.findOne({
    where: { order_number: { [Op.like]: `${prefix}%` } },
    order: [['createdAt', 'DESC']],
    attributes: ['order_number'],
  });

  let nextSeq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.order_number.split('-').pop(), 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${nextSeq.toString().padStart(5, '0')}`;
};

const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, assigned_warehouse_id, order_type, shipping_address, notes_customer, notes_internal, items } = req.body;
    const sales_user_id = req.user.id;

    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(400).json({ message: `Customer with ID ${customer_id} not found.` });
    }
    const warehouse = await Warehouse.findByPk(assigned_warehouse_id, { transaction: t });
    if (!warehouse) {
      await t.rollback();
      return res.status(400).json({ message: `Warehouse with ID ${assigned_warehouse_id} not found.` });
    }

    // let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product || !product.is_active) {
        throw new Error(`Product with ID ${item.product_id} is not valid or inactive.`);
      }
      // const sub_total = item.quantity * item.unit_price;
      // total_amount += sub_total;
      orderItemsData.push({ ...item, unit: item.unit || product.unit });
    }

    const order_number = await generateOrderNumber();

    const newOrder = await Order.create(
      {
        order_number,
        customer_id,
        sales_user_id,
        assigned_warehouse_id,
        order_date: new Date(),
        order_type,
        status: 'Dikonfirmasi Sales',
        shipping_address: shipping_address || customer.shipping_address_default,
        // total_amount,
        notes_customer,
        notes_internal,
      },
      { transaction: t }
    );

    for (const itemData of orderItemsData) {
      await OrderItem.create(
        {
          order_id: newOrder.id,
          ...itemData,
          rental_start_date: null,
          rental_end_date: null,
        },
        { transaction: t }
      );
    }

    await updateOrderStatus(newOrder.id, 'Dikonfirmasi Sales', sales_user_id, 'Order dibuat oleh sales.', t);

    await t.commit();

    res.status(201).json({ message: 'Order created successfully', success: true });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') await t.rollback();
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, customer_id, date_start, date_end, order_number_search } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};
    if (status) whereClause.status = status;
    if (customer_id) whereClause.customer_id = customer_id;
    if (order_number_search) whereClause.order_number = { [Op.iLike]: `%${order_number_search}%` };
    if (date_start && date_end) {
      whereClause.order_date = { [Op.between]: [new Date(date_start), new Date(date_end + 'T23:59:59.999Z')] };
    } else if (date_start) {
      whereClause.order_date = { [Op.gte]: new Date(date_start) };
    } else if (date_end) {
      whereClause.order_date = { [Op.lte]: new Date(date_end + 'T23:59:59.999Z') };
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customer_name', 'company_name'] },
        { model: User, as: 'salesUser', attributes: ['id', 'name'] },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku'],
            },
          ],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [['order_date', 'DESC']],
      distinct: true,
    });

    res.status(200).json({ data: orders, totalItems: count, totalPages: Math.ceil(count / limitNum), currentPage: pageNum });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let whereClause = { id };

    const order = await Order.findOne({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'salesUser', attributes: { exclude: ['password'] } },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                { model: CylinderProperty, as: 'cylinderProperty' },
                { model: GasType, as: 'gasType' },
              ],
            },
            { model: OrderItemAssignment, as: 'assignments', include: [{ model: Cylinder, as: 'cylinder', attributes: ['id', 'barcode_id', 'status'] }] },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatuses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let whereClause = { id };
    if (req.user.role.role_name === 'Sales') {
      whereClause.sales_user_id = req.user.id;
    }

    const order = await Order.findOne({ where: whereClause });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }
    const allowedTransitionsForSales = {
      Baru: ['Dikonfirmasi Sales', 'Dibatalkan Sales'],
      'Dikonfirmasi Sales': ['Dibatalkan Sales'],
    };

    const allowedTransitionsForAdmin = {
      Baru: ['Dikonfirmasi Sales', 'Dibatalkan Sales', 'Dibatalkan Sistem'],
      'Dikonfirmasi Sales': ['Disiapkan Gudang', 'Dibatalkan Sales', 'Dibatalkan Sistem'],
      'Disiapkan Gudang': ['Siap Kirim', 'Dibatalkan Sistem'],
      'Siap Kirim': ['Dikirim', 'Dibatalkan Sistem'],
      Dikirim: ['Selesai', 'Dibatalkan Sistem'],
    };

    let canTransition = false;
    if (req.user.role.role_name === 'Super Admin' || req.user.role.role_name === 'Admin') {
      if (allowedTransitionsForAdmin[order.status] && allowedTransitionsForAdmin[order.status].includes(status)) {
        canTransition = true;
      }
    } else if (req.user.role.role_name === 'Sales') {
      if (allowedTransitionsForSales[order.status] && allowedTransitionsForSales[order.status].includes(status)) {
        canTransition = true;
      }
    }

    if (!canTransition && !(req.user.role.role_name === 'Super Admin')) {
      return res.status(400).json({ message: `Cannot change status from '<span class="math-inline">\{order\.status\}' to '</span>{status}'.` });
    }

    order.status = status;
    await order.save();
    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const reassignWarehouse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { new_warehouse_id } = req.body;

    const order = await Order.findByPk(id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const newWarehouse = await Warehouse.findByPk(new_warehouse_id, { transaction: t });
    if (!newWarehouse) {
      await t.rollback();
      return res.status(400).json({ message: `New warehouse with ID ${new_warehouse_id} not found.` });
    }

    if (['Dikirim', 'Selesai', 'Dibatalkan Sales', 'Dibatalkan Sistem'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ message: `Cannot reassign warehouse, order status is already '${order.status}'.` });
    }

    const existingAssignments = await OrderItemAssignment.findAll({
      include: [
        {
          model: OrderItem,
          as: 'orderItem',
          where: { order_id: id },
        },
      ],
      transaction: t,
    });

    if (existingAssignments.length > 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot reassign warehouse. Items have already been assigned to cylinders from the old warehouse. Please unassign them first.' });
    }

    const oldWarehouseId = order.assigned_warehouse_id;
    order.assigned_warehouse_id = new_warehouse_id;
    await order.save({ transaction: t });

    order.notes_internal = (order.notes_internal || '') + `\n[System] Warehouse reassigned from ID ${oldWarehouseId} to ${new_warehouse_id} by user ${req.user.name} on ${new Date().toISOString()}`;
    await order.save({ transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Order warehouse reassigned successfully.', order });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') await t.rollback();
    next(error);
  }
};

const getOrdersToPrepare = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = { status: 'Dikonfirmasi Sales' };
    if (req.user.role.role_name === 'Petugas Gudang') {
      if (!req.user.warehouse_id) {
        return res.status(200).json({ data: [], totalItems: 0, totalPages: 0, currentPage: 1 });
      }
      whereClause.assigned_warehouse_id = req.user.warehouse_id;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: Warehouse, as: 'assignedWarehouse', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'customer_name'] },
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'cylinder_properties_id', 'gas_type_id'] },
            { model: OrderItemAssignment, as: 'assignments', attributes: ['id', 'cylinder_id'] },
          ],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [['order_date', 'ASC']],
      distinct: true,
    });

    res.status(200).json({ data: orders, totalItems: count, totalPages: Math.ceil(count / limitNum), currentPage: pageNum });
  } catch (error) {
    next(error);
  }
};

const recommendCylinders = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const userWarehouseId = req.user.warehouse_id;
    if (req.user.role.role_name === 'Petugas Gudang' && !userWarehouseId) {
      return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun.' });
    }

    const orderItem = await OrderItem.findOne({
      where: { id: item_id },
      include: [{ model: Product, as: 'product', include: [{ model: CylinderProperty, as: 'cylinderProperty' }] }],
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found.' });
    }
    if (!orderItem.product || !orderItem.product.cylinderProperty) {
      return res.status(400).json({ message: 'Product associated with this item does not have cylinder specifications.' });
    }

    const alreadyAssignedCount = await OrderItemAssignment.count({ where: { order_item_id: item_id } });
    if (alreadyAssignedCount >= orderItem.quantity) {
      return res.status(400).json({ message: `All ${orderItem.quantity} cylinders for this item have already been assigned.` });
    }

    const maxAgeDate = new Date();
    maxAgeDate.setFullYear(maxAgeDate.getFullYear() - orderItem.product.cylinderProperty.max_age_years);

    const recommendedCylinders = await Cylinder.findAll({
      where: {
        cylinder_properties_id: orderItem.product.cylinder_properties_id,
        gas_type_id: orderItem.product.gas_type_id,
        status: 'Di Gudang - Terisi',
        warehouse_id: userWarehouseId,
        manufacture_date: { [Op.gte]: maxAgeDate.toISOString().split('T')[0] },
        id: { [Op.notIn]: literal(`(SELECT cylinder_id FROM order_item_assignments WHERE status != 'Selesai Rental' AND status != 'Dikembalikan Gudang')`) },
      },
      attributes: ['id', 'barcode_id', 'manufacture_date', 'last_fill_date'],
      order: [
        ['manufacture_date', 'ASC'],
        ['last_fill_date', 'ASC'],
      ],
      limit: orderItem.quantity * 2,
    });

    if (recommendedCylinders.length === 0) {
      return res.status(404).json({ message: 'No suitable cylinders available in your warehouse for this item.' });
    }
    res.status(200).json(recommendedCylinders);
  } catch (error) {
    next(error);
  }
};

const assignCylinderToOrderItem = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { item_id } = req.params;
    const { barcode_ids, notes_petugas_gudang } = req.body;
    const user_id = req.user.id;
    const userWarehouseId = req.user.warehouse_id;

    const uniqueBarcodes = [...new Set(barcode_ids)];
    if (uniqueBarcodes.length !== barcode_ids.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Input error: Terdapat barcode yang sama di dalam request.' });
    }

    const orderItem = await OrderItem.findByPk(item_id, {
      include: [{ model: Order, as: 'order' }],
      transaction: t,
    });
    if (!orderItem) {
      await t.rollback();
      return res.status(404).json({ message: 'Order item not found.' });
    }
    if (barcode_ids.length !== orderItem.quantity) {
      await t.rollback();
      return res.status(400).json({ message: `Jumlah barcode (${barcode_ids.length}) tidak sesuai dengan kuantitas order item (${orderItem.quantity}).` });
    }

    const existingAssignments = await OrderItemAssignment.count({ where: { order_item_id: item_id }, transaction: t });
    if (existingAssignments > 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Item ini sudah memiliki tabung yang di-assign. Hapus assignment lama jika ingin mengubah.' });
    }
    const cylindersToAssign = [];
    for (const barcode of barcode_ids) {
      const cylinder = await Cylinder.findOne({ where: { barcode_id: barcode }, transaction: t });

      if (!cylinder) throw new Error(`Barcode '${barcode}' tidak ditemukan.`);
      if (cylinder.cylinder_properties_id !== orderItem.cylinder_properties_id) throw new Error(`Barcode '${barcode}': Jenis tabung tidak cocok.`);
      if (cylinder.gas_type_id !== orderItem.gas_type_id) throw new Error(`Barcode '${barcode}': Jenis gas tidak cocok.`);
      if (cylinder.warehouse_id !== userWarehouseId) throw new Error(`Barcode '${barcode}': Tidak berada di gudang Anda.`);
      if (cylinder.status !== 'Di Gudang - Terisi') throw new Error(`Barcode '${barcode}': Status tidak tersedia.`);
      if (cylinder.current_order_item_id) throw new Error(`Barcode '${barcode}': Sudah dialokasikan untuk order lain.`);

      cylindersToAssign.push(cylinder);
    }

    const assignments = [];
    for (const cylinder of cylindersToAssign) {
      const assignment = await OrderItemAssignment.create(
        {
          order_item_id: item_id,
          cylinder_id: cylinder.id,
          status: 'Dialokasikan',
          assigned_at: new Date(),
        },
        { transaction: t }
      );
      assignments.push(assignment);

      cylinder.status = 'Dialokasikan Untuk Order';
      cylinder.current_order_item_id = item_id;
      await cylinder.save({ transaction: t });

      await StockMovement.create(
        {
          cylinder_id: cylinder.id,
          user_id: user_id,
          movement_type: 'DIALOKASIKAN_KE_ORDER',
          to_warehouse_id: cylinder.warehouse_id,
          notes: `Dialokasikan untuk Order Item ID ${item_id} (Order No: ${orderItem.order.order_number}).`,
          timestamp: new Date(),
          order_id: orderItem.order_id,
        },
        { transaction: t }
      );
    }

    if (notes_petugas_gudang) {
      orderItem.notes_petugas_gudang = notes_petugas_gudang;
      await orderItem.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: `Successfully assigned ${assignments.length} cylinders to order item.`, assignments });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') await t.rollback();
    res.status(400).json({ message: error.message || 'An error occurred during assignment.' });
  }
};

const assignAllCylindersToOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { order_id } = req.params;
    const { assignments, notes_petugas_gudang } = req.body;
    const user_id = req.user.id;
    const userWarehouseId = req.user.warehouse_id;

    const order = await Order.findByPk(order_id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status !== 'Dikonfirmasi Sales') {
      await t.rollback();
      return res.status(400).json({ message: `Order status is '${order.status}', cannot assign cylinders.` });
    }

    const orderItemsMap = new Map(order.items.map((item) => [item.id, item]));

    if (assignments.length !== order.items.length) {
      throw new Error(`Input error: Jumlah item yang di-assign (${assignments.length}) tidak cocok dengan jumlah item di order (${order.items.length}).`);
    }

    let allBarcodes = [];
    for (const assignment of assignments) {
      const orderItem = orderItemsMap.get(assignment.order_item_id);
      if (!orderItem) {
        throw new Error(`Input error: Order Item ID ${assignment.order_item_id} tidak ditemukan pada order ini.`);
      }
      if (assignment.barcode_ids.length !== orderItem.quantity) {
        throw new Error(`Input error: Untuk Item ID ${orderItem.id}, jumlah barcode (${assignment.barcode_ids.length}) tidak sesuai dengan kuantitas order (${orderItem.quantity}).`);
      }
      allBarcodes.push(...assignment.barcode_ids);
    }

    if (new Set(allBarcodes).size !== allBarcodes.length) {
      throw new Error('Input error: Terdapat barcode duplikat dalam request.');
    }

    const cylinders = await Cylinder.findAll({
      where: { barcode_id: { [Op.in]: allBarcodes } },
      transaction: t,
    });

    if (cylinders.length !== allBarcodes.length) {
      throw new Error('Database error: Satu atau lebih barcode tidak ditemukan.');
    }

    const cylindersMap = new Map(cylinders.map((cyl) => [cyl.barcode_id, cyl]));

    for (const assignment of assignments) {
      const orderItem = orderItemsMap.get(assignment.order_item_id);
      for (const barcode of assignment.barcode_ids) {
        const cylinder = cylindersMap.get(barcode);
        if (cylinder.cylinder_properties_id !== orderItem.product.cylinder_properties_id) throw new Error(`Barcode '${barcode}': Jenis tabung tidak cocok.`);
        if (cylinder.gas_type_id !== orderItem.product.gas_type_id) throw new Error(`Barcode '${barcode}': Jenis gas tidak cocok.`);
        if (cylinder.warehouse_id !== userWarehouseId) throw new Error(`Barcode '${barcode}': Tidak berada di gudang Anda.`);
        if (cylinder.status !== 'Di Gudang - Terisi') throw new Error(`Barcode '${barcode}': Status tidak tersedia.`);
      }
    }

    for (const assignment of assignments) {
      for (const barcode of assignment.barcode_ids) {
        const cylinder = cylindersMap.get(barcode);

        await OrderItemAssignment.create(
          {
            order_item_id: assignment.order_item_id,
            cylinder_id: cylinder.id,
            status: 'Dialokasikan',
          },
          { transaction: t }
        );

        cylinder.status = 'Dialokasikan Untuk Order';
        cylinder.current_order_item_id = assignment.order_item_id;
        await cylinder.save({ transaction: t });

        await StockMovement.create(
          {
            cylinder_id: cylinder.id,
            user_id,
            movement_type: 'DIALOKASIKAN_KE_ORDER',
            to_warehouse_id: cylinder.warehouse_id,
            order_id,
            notes: `Dialokasikan untuk Order Item ID ${assignment.order_item_id} (Order No: ${order.order_number}).`,
          },
          { transaction: t }
        );
      }
    }

    if (notes_petugas_gudang) {
      order.notes_internal = (order.notes_internal || '') + `\n[Catatan Gudang]: ${notes_petugas_gudang}`;
      await order.save({ transaction: t });
    }

    const noteForHistory = notes_petugas_gudang ? `Semua tabung dialokasikan. Catatan: ${notes_petugas_gudang}` : 'Semua tabung untuk order telah dialokasikan oleh gudang.';
    await updateOrderStatus(order.id, 'Disiapkan Gudang', user_id, noteForHistory, t);

    await t.commit();
    res.status(201).json({ message: `Successfully assigned ${allBarcodes.length} cylinders across ${assignments.length} items for order ${order.order_number}.` });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') await t.rollback();
    res.status(400).json({ message: error.message || 'An error occurred during bulk assignment.' });
  }
};

const markOrderPrepared = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { order_id } = req.params;
    const user_id = req.user.id;
    const order = await Order.findByPk(order_id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'quantity'],
        },
      ],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.status !== 'Dikonfirmasi Sales' && order.status !== 'Disiapkan Gudang') {
      await t.rollback();
      return res.status(400).json({ message: `Order status is '${order.status}', cannot mark as prepared.` });
    }

    const allOrderItemIds = order.items.map((item) => item.id);

    for (const item of order.items) {
      const assignedCount = await OrderItemAssignment.count({
        where: { order_item_id: item.id },
        transaction: t,
      });
      if (assignedCount < item.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Not all items are fully assigned. Item ID ${item.id} needs ${item.quantity}, has ${assignedCount}.` });
      }
    }

    const assignments = await OrderItemAssignment.findAll({
      where: {
        order_item_id: { [Op.in]: allOrderItemIds },
      },
      attributes: ['id', 'cylinder_id'],
      transaction: t,
    });

    const allAssignmentIds = assignments.map((a) => a.id);
    const allCylinderIds = assignments.map((a) => a.cylinder_id);

    if (allAssignmentIds.length > 0) {
      await OrderItemAssignment.update({ status: 'Siap Kirim' }, { where: { id: { [Op.in]: allAssignmentIds } }, transaction: t });
    }

    if (allCylinderIds.length > 0) {
      await Cylinder.update({ status: 'Siap Kirim' }, { where: { id: { [Op.in]: allCylinderIds } }, transaction: t });
    }

    order.status = 'Siap Kirim';
    await order.save({ transaction: t });

    await updateOrderStatus(order.id, 'Siap Kirim', user_id, 'Order telah dikonfirmasi siap kirim oleh gudang.', t);

    await t.commit();

    res.status(200).json({ message: 'Order marked as "Siap Kirim" successfully. All related statuses have been updated.', success: true });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') await t.rollback();
    next(error);
  }
};

const validateCylindersForOrderItem = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { barcode_ids } = req.body;
    const userWarehouseId = req.user.warehouse_id;

    const orderItem = await OrderItem.findByPk(item_id, { include: [{ model: Product, as: 'product' }] });
    if (!orderItem || !orderItem.product) {
      return res.status(404).json({ message: 'Order item or associated product not found.' });
    }

    const validationResults = [];
    for (const barcode of barcode_ids) {
      const cylinder = await Cylinder.findOne({ where: { barcode_id: barcode } });
      let result = { barcode, isValid: false, reason: '' };
      if (!cylinder) {
        result.reason = 'Barcode tidak ditemukan.';
      } else if (cylinder.cylinder_properties_id !== orderItem.product.cylinder_properties_id) {
        result.reason = `Jenis tabung tidak cocok.`;
      } else if (cylinder.gas_type_id !== orderItem.product.gas_type_id) {
        result.reason = `Jenis gas tidak cocok.`;
      } else if (cylinder.warehouse_id !== userWarehouseId) {
        result.reason = 'Tabung tidak berada di gudang Anda.';
      } else if (cylinder.status !== 'Di Gudang - Terisi') {
        result.reason = `Status tabung adalah '${cylinder.status}'.`;
      } else if (cylinder.current_order_item_id) {
        result.reason = `Tabung sudah dialokasikan untuk order lain.`;
      } else {
        result.isValid = true;
        result.reason = 'Cocok dan tersedia.';
      }
      validationResults.push(result);
    }
    res.status(200).json({ message: 'Validation check complete.', results: validationResults });
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await OrderStatusHistory.findAll({
      where: { order_id: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['timestamp', 'ASC']],
    });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const orderId = req.params.id;
    const { notes } = req.body;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items', attributes: ['id'] }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const cancellableStatuses = ['Baru', 'Dikonfirmasi Sales', 'Disiapkan Gudang', 'Siap Kirim', 'Dalam Proses Pengiriman'];
    if (!cancellableStatuses.includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ message: `Cannot cancel order with current status: '${order.status}'.` });
    }

    const orderItemIds = order.items.map((item) => item.id);
    if (orderItemIds.length > 0) {
      const assignments = await OrderItemAssignment.findAll({
        where: { order_item_id: { [Op.in]: orderItemIds } },
        transaction: t,
      });

      if (assignments.length > 0) {
        const cylinderIdsToRelease = assignments.map((a) => a.cylinder_id);

        await Cylinder.update(
          {
            status: 'Di Gudang - Terisi',
            current_order_item_id: null,
          },
          {
            where: { id: { [Op.in]: cylinderIdsToRelease } },
            transaction: t,
          }
        );

        const assignmentIdsToDelete = assignments.map((a) => a.id);
        await OrderItemAssignment.destroy({
          where: { id: { [Op.in]: assignmentIdsToDelete } },
          transaction: t,
        });
      }
    }

    const finalNotes = `Pesanan dibatalkan oleh user. Catatan: ${notes || 'Tidak ada catatan.'}`;
    await updateOrderStatus(orderId, 'Dibatalkan Sales', userId, finalNotes, t);

    await t.commit();

    res.status(200).json({ message: 'Order has been successfully cancelled.' });
  } catch (error) {
    if (t.finished !== 'commit' && t.finished !== 'rollback') {
      await t.rollback();
    }
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatuses,
  getOrdersToPrepare,
  recommendCylinders,
  assignCylinderToOrderItem,
  markOrderPrepared,
  reassignWarehouse,
  validateCylindersForOrderItem,
  assignAllCylindersToOrder,
  getOrderHistory,
  cancelOrder,
};
