const { Cylinder, StockMovement, CylinderProperty, GasType, Warehouse, sequelize, User } = require('../models'); // Tambahkan User
const { Op } = require('sequelize');
const { cylinderStatuses, movementTypes } = require('../validators/cylinder.validator');

const createStockMovementEntry = async (cylinder_id, user_id, movement_type, to_warehouse_id, notes = null, from_warehouse_id = null, transaction = null) => {
  await StockMovement.create(
    {
      cylinder_id,
      user_id,
      movement_type,
      from_warehouse_id,
      to_warehouse_id,
      notes,
      timestamp: new Date(),
    },
    { transaction }
  );
};

const createCylinder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { barcode_ids, cylinder_properties_id, gas_type_id, status, manufacture_date, last_fill_date, is_owned_by_customer = false, notes } = req.body;
    let { warehouse_id } = req.body;

    const user_id = req.user.id;
    const userRole = req.user.role.role_name;
    const userWarehouseId = req.user.warehouse_id;

    if (!Array.isArray(barcode_ids) || barcode_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'barcode_ids must be a non-empty array.' });
    }

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        await t.rollback();
        return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun. Tidak dapat mendaftarkan tabung.' });
      }
      warehouse_id = userWarehouseId;
    } else if (!warehouse_id) {
      await t.rollback();
      return res.status(400).json({ message: 'Warehouse ID is required for registration.' });
    }

    const cylinderProperty = await CylinderProperty.findByPk(cylinder_properties_id, { transaction: t });
    if (!cylinderProperty) {
      await t.rollback();
      return res.status(400).json({ message: 'Cylinder Property not found.' });
    }

    const targetWarehouse = await Warehouse.findByPk(warehouse_id, { transaction: t });
    if (!targetWarehouse) {
      await t.rollback();
      return res.status(400).json({ message: `Warehouse with ID ${warehouse_id} not found.` });
    }

    if (status === 'Di Gudang - Terisi' && !gas_type_id) {
      await t.rollback();
      return res.status(400).json({ message: 'Gas Type ID is required when status is "Di Gudang - Terisi".' });
    }
    if (gas_type_id) {
      const gasType = await GasType.findByPk(gas_type_id, { transaction: t });
      if (!gasType) {
        await t.rollback();
        return res.status(400).json({ message: 'Gas Type not found.' });
      }
    }

    const createdCylinders = [];
    for (const barcode_id of barcode_ids) {
      const newCylinder = await Cylinder.create(
        {
          barcode_id,
          cylinder_properties_id,
          gas_type_id: status === 'Di Gudang - Kosong' ? null : gas_type_id,
          warehouse_id: targetWarehouse.id,
          status,
          manufacture_date,
          last_fill_date: status === 'Di Gudang - Terisi' ? last_fill_date || new Date() : null,
          is_owned_by_customer,
          notes,
        },
        { transaction: t }
      );

      await createStockMovementEntry(
        newCylinder.id,
        user_id,
        movementTypes.find((mt) => mt === 'TERIMA_BARU'),
        targetWarehouse.id,
        `Tabung baru ${newCylinder.barcode_id} didaftarkan di gudang ${targetWarehouse.name} dengan status ${status}.`,
        null,
        t
      );
      createdCylinders.push(newCylinder);
    }

    await t.commit();

    const newCylinderIds = createdCylinders.map((c) => c.id);
    const resultCylinders = await Cylinder.findAll({
      where: {
        id: {
          [Op.in]: newCylinderIds,
        },
      },
      include: [
        { model: CylinderProperty, as: 'cylinderProperty' },
        { model: GasType, as: 'gasType' },
        { model: Warehouse, as: 'currentWarehouse' },
      ],
    });

    res.status(201).json({
      message: `${createdCylinders.length} cylinders registered successfully.`,
      data: resultCylinders,
    });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message, value: err.value }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getAllCylinders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', warehouseId, sortBy = 'manufacture_date', sortOrder = 'ASC', status } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};
    if (search) {
      whereClause.barcode_id = { [Op.iLike]: `%${search}%` };
    }
    if (status) {
      whereClause.status = status;
    }

    const userRole = req.user.role.role_name;
    const userWarehouseId = req.user.warehouse_id;

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang untuk melihat tabung.' });
      }
      whereClause.warehouse_id = userWarehouseId;
      if (warehouseId && parseInt(warehouseId, 10) !== userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Anda hanya dapat melihat tabung di gudang Anda.' });
      }
    } else if (userRole === 'Admin' || userRole === 'Super Admin') {
      if (warehouseId) {
        whereClause.warehouse_id = parseInt(warehouseId, 10);
      }
    } else {
      if (!userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Akses tidak diizinkan atau Anda tidak ditugaskan ke gudang.' });
      }
      whereClause.warehouse_id = userWarehouseId;
    }

    const validSortBy = ['barcode_id', 'status', 'manufacture_date', 'last_fill_date', 'createdAt', 'updatedAt'];
    const order = [[validSortBy.includes(sortBy) ? sortBy : 'manufacture_date', sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];

    const { count, rows: cylinders } = await Cylinder.findAndCountAll({
      where: whereClause,
      include: [
        { model: CylinderProperty, as: 'cylinderProperty', attributes: ['name', 'size_cubic_meter'] },
        { model: GasType, as: 'gasType', attributes: ['name'] },
        { model: Warehouse, as: 'currentWarehouse', attributes: ['name'] },
      ],
      limit: limitNum,
      offset: offset,
      order,
      distinct: true,
    });

    res.status(200).json({
      data: cylinders,
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};

const updateCylinderStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const cylinderId = req.params.id;
    const { status, gas_type_id, last_fill_date, notes } = req.body;
    let { warehouse_id_param } = req.body;

    const user_id = req.user.id;
    const userRole = req.user.role.role_name;
    const userWarehouseId = req.user.warehouse_id;

    const cylinder = await Cylinder.findByPk(cylinderId, {
      include: ['cylinderProperty', 'gasType', 'currentWarehouse'],
      transaction: t,
    });

    if (!cylinder) {
      await t.rollback();
      return res.status(404).json({ message: 'Cylinder not found.' });
    }

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        await t.rollback();
        return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun.' });
      }
      if (cylinder.warehouse_id !== userWarehouseId) {
        await t.rollback();
        return res.status(403).json({ message: 'Forbidden: Anda hanya dapat mengubah status tabung di gudang Anda.' });
      }
      if (warehouse_id_param && parseInt(warehouse_id_param, 10) !== userWarehouseId) {
        await t.rollback();
        return res.status(403).json({ message: 'Forbidden: Petugas Gudang hanya bisa operasional di gudangnya sendiri.' });
      }
      warehouse_id_param = userWarehouseId;
    } else if ((userRole === 'Admin' || userRole === 'Super Admin') && warehouse_id_param) {
      const checkNewWarehouse = await Warehouse.findByPk(warehouse_id_param, { transaction: t });
      if (!checkNewWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: `Warehouse tujuan dengan ID ${warehouse_id_param} tidak ditemukan.` });
      }
    } else {
      warehouse_id_param = cylinder.warehouse_id;
    }

    const oldStatus = cylinder.status;
    const oldGasTypeId = cylinder.gas_type_id;
    const oldWarehouseId = cylinder.warehouse_id;
    let newWarehouseName = cylinder.currentWarehouse.name;

    if (status === 'Di Gudang - Terisi') {
      if (!gas_type_id) {
        await t.rollback();
        return res.status(400).json({ message: 'Gas Type ID is required when status is "Di Gudang - Terisi".' });
      }
      if (!last_fill_date && !cylinder.last_fill_date) {
        cylinder.last_fill_date = new Date();
      } else if (last_fill_date) {
        cylinder.last_fill_date = last_fill_date;
      }
      cylinder.gas_type_id = gas_type_id;

      const gasType = await GasType.findByPk(gas_type_id, { transaction: t });
      if (!gasType) {
        await t.rollback();
        return res.status(400).json({ message: 'Gas Type not found.' });
      }
    } else if (status === 'Di Gudang - Kosong') {
      cylinder.gas_type_id = null;
    }

    cylinder.status = status;
    if (notes !== undefined) cylinder.notes = notes;

    let movementNote = `Status tabung ${cylinder.barcode_id} diubah dari ${oldStatus} menjadi ${status}.`;
    let movementType = movementTypes.find((mt) => mt === 'UPDATE_STATUS');

    if (oldStatus.includes('Kosong') && status.includes('Terisi')) {
      movementType = movementTypes.find((mt) => mt === 'ISI_ULANG');
      movementNote = `Tabung ${cylinder.barcode_id} diisi ulang di gudang ${cylinder.currentWarehouse.name}. Status: ${status}.`;
    }

    let toWarehouseForMovement = oldWarehouseId;
    let fromWarehouseForMovement = null;

    if (warehouse_id_param && parseInt(warehouse_id_param, 10) !== oldWarehouseId) {
      const newWarehouse = await Warehouse.findByPk(parseInt(warehouse_id_param, 10), { transaction: t });
      if (!newWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: `Warehouse tujuan dengan ID ${warehouse_id_param} tidak ditemukan.` });
      }
      cylinder.warehouse_id = newWarehouse.id;
      newWarehouseName = newWarehouse.name;
      toWarehouseForMovement = newWarehouse.id;
      fromWarehouseForMovement = oldWarehouseId;

      movementNote += ` Dipindahkan dari gudang ${cylinder.currentWarehouse.name} ke gudang ${newWarehouse.name}.`;
    }

    await cylinder.save({ transaction: t });

    await createStockMovementEntry(cylinder.id, user_id, movementType, toWarehouseForMovement, movementNote, fromWarehouseForMovement, t);

    await t.commit();
    const updatedCylinder = await Cylinder.findByPk(cylinder.id, {
      include: [
        { model: CylinderProperty, as: 'cylinderProperty' },
        { model: GasType, as: 'gasType' },
        { model: Warehouse, as: 'currentWarehouse' },
      ],
    });
    res.status(200).json({ message: 'Cylinder status updated successfully.', cylinder: updatedCylinder });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map((err) => ({ field: err.path, message: err.message }));
      return res.status(400).json({ message: 'Validation Error', errors });
    }
    next(error);
  }
};

const getCylinderDetails = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    let cylinder;
    const userRole = req.user.role.role_name;
    const userWarehouseId = req.user.warehouse_id;

    let findOptions = {
      include: [
        { model: CylinderProperty, as: 'cylinderProperty', attributes: ['name', 'size_cubic_meter', 'material', 'max_age_years'] },
        { model: GasType, as: 'gasType', attributes: ['name'] },
        { model: Warehouse, as: 'currentWarehouse', attributes: ['name', 'address'] },
        {
          model: StockMovement,
          as: 'stockMovements',
          limit: 10,
          order: [['timestamp', 'DESC']],
          include: [
            { model: User, as: 'user', attributes: ['name', 'username'] },
            { model: Warehouse, as: 'fromWarehouse', attributes: ['name'] },
            { model: Warehouse, as: 'toWarehouse', attributes: ['name'] },
          ],
        },
      ],
    };

    if (isNaN(parseInt(identifier, 10))) {
      findOptions.where = { barcode_id: identifier };
    } else {
      findOptions.where = { id: parseInt(identifier, 10) };
    }

    cylinder = await Cylinder.findOne(findOptions);

    if (!cylinder) {
      return res.status(404).json({ message: 'Cylinder not found. Would you like to register it?', action: 'registerNew' });
    }

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun.' });
      }
      if (cylinder.warehouse_id !== userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Anda hanya dapat melihat detail tabung di gudang Anda.' });
      }
    }

    res.status(200).json(cylinder);
  } catch (error) {
    next(error);
  }
};

const getStockSummary = async (req, res, next) => {
  try {
    let targetWarehouseIdQuery = req.query.warehouse_id;
    const userRole = req.user.role.role_name;
    const userWarehouseId = req.user.warehouse_id;
    let effectiveWarehouseId = null;

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Anda tidak ditugaskan ke gudang.' });
      }
      effectiveWarehouseId = userWarehouseId;
    } else if (userRole === 'Admin' || userRole === 'Super Admin') {
      if (targetWarehouseIdQuery) {
        effectiveWarehouseId = parseInt(targetWarehouseIdQuery, 10);
      }
    } else {
      if (!userWarehouseId) {
        return res.status(403).json({ message: 'Forbidden: Akses tidak diizinkan atau Anda tidak ditugaskan ke gudang.' });
      }
      effectiveWarehouseId = userWarehouseId;
    }

    const whereClause = {};
    if (effectiveWarehouseId) {
      whereClause.warehouse_id = effectiveWarehouseId;
    }

    const totalCylinders = await Cylinder.count({ where: whereClause });
    const filledCylinders = await Cylinder.count({
      where: { ...whereClause, status: 'Di Gudang - Terisi' },
    });
    const emptyCylinders = await Cylinder.count({
      where: { ...whereClause, status: 'Di Gudang - Kosong' },
    });

    const filledCylindersByGasType = await Cylinder.findAll({
      where: { ...whereClause, status: 'Di Gudang - Terisi' },
      include: [{ model: GasType, as: 'gasType', attributes: ['name'], required: true }],
      attributes: [[sequelize.fn('COUNT', sequelize.col('Cylinder.id')), 'count']],
      group: ['gasType.id', 'gasType.name'],
      raw: true,
    });

    const formattedFilledByGasType = filledCylindersByGasType.map((item) => ({
      gas_type_name: item['gasType.name'],
      count: parseInt(item.count, 10),
    }));

    let warehouseInfo = null;
    if (effectiveWarehouseId) {
      warehouseInfo = await Warehouse.findByPk(effectiveWarehouseId, { attributes: ['id', 'name'] });
    } else if (userRole === 'Admin' || userRole === 'Super Admin') {
      warehouseInfo = { id: null, name: 'Semua Gudang Terdaftar' };
    }

    res.status(200).json({
      warehouse: warehouseInfo,
      total_cylinders: totalCylinders,
      filled_cylinders_total: filledCylinders,
      empty_cylinders_total: emptyCylinders,
      filled_by_gas_type: formattedFilledByGasType,
    });
  } catch (error) {
    next(error);
  }
};

const bulkCreateCylinders = async (req, res, next) => {
  const cylindersData = req.body;
  const t = await sequelize.transaction();
  const results = [];
  const errors = [];

  const user_id = req.user.id;
  const userRole = req.user.role.role_name;
  const userWarehouseId = req.user.warehouse_id;

  try {
    const cylinderPropertyIds = [...new Set(cylindersData.map((c) => c.cylinder_properties_id).filter((id) => id))];
    const gasTypeIds = [...new Set(cylindersData.map((c) => c.gas_type_id).filter((id) => id))];
    let requestWarehouseIds = [...new Set(cylindersData.map((c) => c.warehouse_id).filter((id) => id))];

    const [dbCylinderProperties, dbGasTypes, dbWarehouses] = await Promise.all([
      CylinderProperty.findAll({ where: { id: { [Op.in]: cylinderPropertyIds } }, transaction: t }),
      GasType.findAll({ where: { id: { [Op.in]: gasTypeIds } }, transaction: t }),
      Warehouse.findAll({ where: { id: { [Op.in]: requestWarehouseIds } }, transaction: t }),
    ]);

    const cylinderPropertiesMap = new Map(dbCylinderProperties.map((cp) => [cp.id, cp]));
    const gasTypesMap = new Map(dbGasTypes.map((gt) => [gt.id, gt]));
    const warehousesMap = new Map(dbWarehouses.map((w) => [w.id, w]));

    for (let i = 0; i < cylindersData.length; i++) {
      const data = cylindersData[i];
      let effective_warehouse_id = data.warehouse_id;

      if (userRole === 'Petugas Gudang') {
        if (!userWarehouseId) {
          errors.push({ index: i, barcode_id: data.barcode_id, message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun.' });
          continue;
        }
        effective_warehouse_id = userWarehouseId;
      } else if (!effective_warehouse_id) {
        errors.push({ index: i, barcode_id: data.barcode_id, message: 'Warehouse ID is required for registration for your role.' });
        continue;
      }

      if (!cylinderPropertiesMap.has(data.cylinder_properties_id)) {
        errors.push({ index: i, barcode_id: data.barcode_id, message: `Cylinder Property ID ${data.cylinder_properties_id} not found.` });
        continue;
      }
      if (!warehousesMap.has(effective_warehouse_id) && !(userRole === 'Petugas Gudang' && userWarehouseId)) {
        const checkWh = userRole === 'Petugas Gudang' ? await Warehouse.findByPk(effective_warehouse_id, { transaction: t }) : warehousesMap.get(effective_warehouse_id);
        if (!checkWh) {
          errors.push({ index: i, barcode_id: data.barcode_id, message: `Warehouse ID ${effective_warehouse_id} not found.` });
          continue;
        }
        if (userRole !== 'Petugas Gudang') warehousesMap.set(effective_warehouse_id, checkWh);
      }
      if (data.status === 'Di Gudang - Terisi') {
        if (!data.gas_type_id) {
          errors.push({ index: i, barcode_id: data.barcode_id, message: 'Gas Type ID is required when status is "Di Gudang - Terisi".' });
          continue;
        }
        if (!gasTypesMap.has(data.gas_type_id)) {
          errors.push({ index: i, barcode_id: data.barcode_id, message: `Gas Type ID ${data.gas_type_id} not found.` });
          continue;
        }
      }

      try {
        const newCylinder = await Cylinder.create(
          {
            ...data,
            gas_type_id: data.status === 'Di Gudang - Kosong' ? null : data.gas_type_id,
            warehouse_id: effective_warehouse_id,
            last_fill_date: data.status === 'Di Gudang - Terisi' ? data.last_fill_date || new Date() : null,
            is_owned_by_customer: data.is_owned_by_customer !== undefined ? data.is_owned_by_customer : false,
          },
          { transaction: t }
        );

        const targetWarehouseForMovement = userRole === 'Petugas Gudang' ? await Warehouse.findByPk(effective_warehouse_id, { transaction: t, attributes: ['name'] }) : warehousesMap.get(effective_warehouse_id);

        await createStockMovementEntry(
          newCylinder.id,
          user_id,
          movementTypes.find((mt) => mt === 'TERIMA_BARU'),
          effective_warehouse_id,
          `Tabung baru ${newCylinder.barcode_id} didaftarkan via bulk di gudang ${targetWarehouseForMovement.name} dengan status ${data.status}.`,
          null,
          t
        );
        results.push({ index: i, barcode_id: newCylinder.barcode_id, id: newCylinder.id, status: 'success' });
      } catch (error) {
        let errorMessage = 'Failed to create cylinder.';
        if (error.name === 'SequelizeUniqueConstraintError') {
          errorMessage = error.errors.map((e) => `${e.path} '${e.value}' already exists.`).join(' ');
        } else if (error.name === 'SequelizeValidationError') {
          errorMessage = error.errors.map((e) => e.message).join(' ');
        }
        errors.push({ index: i, barcode_id: data.barcode_id, message: errorMessage, details: error.errors });
      }
    }

    if (errors.length > 0) {
      await t.rollback();
      const simplifiedErrors = errors.map((e) => ({ barcode_id: e.barcode_id, message: e.message }));
      return res.status(400).json({
        message: `Failed to create some cylinders. ${errors.length} out of ${cylindersData.length} failed. All changes have been rolled back.`,
        errors: simplifiedErrors,
        processed_successfully: results.filter((r) => r.status === 'success').length,
      });
    }

    await t.commit();
    res.status(201).json({
      message: `Successfully created ${results.length} cylinders.`,
      results: results,
    });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    next(error);
  }
};

const bulkUpdateCylindersStatus = async (req, res, next) => {
  const updatesArray = req.body;
  const t = await sequelize.transaction();
  const results = [];
  const errors = [];

  const user_id = req.user.id;
  const userRole = req.user.role.role_name;
  const userWarehouseId = req.user.warehouse_id;

  const cylinderIds = updatesArray.map((upd) => upd.id).filter((id) => id);
  const cylinderBarcodeIds = updatesArray.map((upd) => upd.barcode_id).filter((bc) => bc);

  const dbCylindersById = await Cylinder.findAll({
    where: { id: { [Op.in]: cylinderIds } },
    include: ['currentWarehouse'],
    transaction: t,
  });
  const dbCylindersByBarcode = await Cylinder.findAll({
    where: { barcode_id: { [Op.in]: cylinderBarcodeIds } },
    include: ['currentWarehouse'],
    transaction: t,
  });

  const cylindersMap = new Map();
  dbCylindersById.forEach((c) => cylindersMap.set(c.id.toString(), c));
  dbCylindersByBarcode.forEach((c) => cylindersMap.set(c.barcode_id, c));

  const gasTypeIds = [...new Set(updatesArray.map((upd) => upd.gas_type_id).filter((id) => id))];
  const warehouseParamIds = [...new Set(updatesArray.map((upd) => upd.warehouse_id_param).filter((id) => id))];

  const [dbGasTypes, dbWarehousesParams] = await Promise.all([GasType.findAll({ where: { id: { [Op.in]: gasTypeIds } }, transaction: t }), Warehouse.findAll({ where: { id: { [Op.in]: warehouseParamIds } }, transaction: t })]);
  const gasTypesMap = new Map(dbGasTypes.map((gt) => [gt.id, gt]));
  const warehousesParamsMap = new Map(dbWarehousesParams.map((w) => [w.id, w]));

  for (let i = 0; i < updatesArray.length; i++) {
    const updateData = updatesArray[i];
    const identifier = updateData.id ? updateData.id.toString() : updateData.barcode_id;
    const cylinder = cylindersMap.get(identifier);

    if (!cylinder) {
      errors.push({ identifier, message: 'Cylinder not found.' });
      continue;
    }

    if (userRole === 'Petugas Gudang') {
      if (!userWarehouseId) {
        errors.push({ identifier, message: 'Forbidden: Anda tidak ditugaskan ke gudang manapun.' });
        continue;
      }
      if (cylinder.warehouse_id !== userWarehouseId) {
        errors.push({ identifier, message: 'Forbidden: Anda hanya dapat mengubah status tabung di gudang Anda.' });
        continue;
      }
      if (updateData.warehouse_id_param && parseInt(updateData.warehouse_id_param, 10) !== userWarehouseId) {
        errors.push({ identifier, message: 'Forbidden: Petugas Gudang hanya bisa operasional di gudangnya sendiri.' });
        continue;
      }
      updateData.warehouse_id_param = userWarehouseId;
    } else if ((userRole === 'Admin' || userRole === 'Super Admin') && updateData.warehouse_id_param) {
      if (!warehousesParamsMap.has(parseInt(updateData.warehouse_id_param, 10))) {
        errors.push({ identifier, message: `Target Warehouse ID ${updateData.warehouse_id_param} not found.` });
        continue;
      }
    } else {
      updateData.warehouse_id_param = cylinder.warehouse_id;
    }

    const oldStatus = cylinder.status;
    const oldWarehouseId = cylinder.warehouse_id;
    const currentCylinderWarehouseName = cylinder.currentWarehouse.name;

    if (updateData.status === 'Di Gudang - Terisi') {
      if (!updateData.gas_type_id) {
        errors.push({ identifier, message: 'Gas Type ID is required when status is "Di Gudang - Terisi".' });
        continue;
      }
      if (!gasTypesMap.has(parseInt(updateData.gas_type_id, 10))) {
        errors.push({ identifier, message: `Gas Type ID ${updateData.gas_type_id} not found.` });
        continue;
      }
      cylinder.gas_type_id = updateData.gas_type_id;
      cylinder.last_fill_date = updateData.last_fill_date || new Date();
    } else if (updateData.status === 'Di Gudang - Kosong') {
      cylinder.gas_type_id = null;
    }

    cylinder.status = updateData.status;
    if (updateData.notes !== undefined) cylinder.notes = updateData.notes;

    let movementNote = `Status tabung ${cylinder.barcode_id} diubah dari ${oldStatus} menjadi ${cylinder.status}.`;
    let movementType = movementTypes.find((mt) => mt === 'UPDATE_STATUS');
    if (oldStatus.includes('Kosong') && cylinder.status.includes('Terisi')) {
      movementType = movementTypes.find((mt) => mt === 'ISI_ULANG');
      movementNote = `Tabung ${cylinder.barcode_id} diisi ulang di gudang ${currentCylinderWarehouseName}. Status: ${cylinder.status}.`;
    }

    let toWarehouseForMovement = oldWarehouseId;
    let fromWarehouseForMovement = null;

    if (updateData.warehouse_id_param && parseInt(updateData.warehouse_id_param, 10) !== oldWarehouseId) {
      const newWarehouse = warehousesParamsMap.get(parseInt(updateData.warehouse_id_param, 10));
      cylinder.warehouse_id = newWarehouse.id;
      toWarehouseForMovement = newWarehouse.id;
      fromWarehouseForMovement = oldWarehouseId;
      movementNote += ` Dipindahkan dari gudang ${currentCylinderWarehouseName} ke gudang ${newWarehouse.name}.`;
    }

    try {
      await cylinder.save({ transaction: t });
      await createStockMovementEntry(cylinder.id, user_id, movementType, toWarehouseForMovement, movementNote, fromWarehouseForMovement, t);
      results.push({ identifier, id: cylinder.id, barcode_id: cylinder.barcode_id, status: 'success' });
    } catch (error) {
      errors.push({ identifier, message: 'Failed to update cylinder or create stock movement.', details: error.message });
    }
  }

  if (errors.length > 0) {
    await t.rollback();
    return res.status(400).json({
      message: `Failed to update some cylinders. ${errors.length} out of ${updatesArray.length} failed. All changes rolled back.`,
      errors: errors,
      processed_successfully: results.filter((r) => r.status === 'success').length,
    });
  }

  await t.commit();
  res.status(200).json({
    message: `Successfully updated ${results.length} cylinders.`,
    results: results,
  });
};

module.exports = {
  createCylinder,
  getAllCylinders,
  updateCylinderStatus,
  getCylinderDetails,
  getStockSummary,
  bulkCreateCylinders,
  bulkUpdateCylindersStatus,
};
