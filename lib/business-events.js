export async function createAuditLog(tx, { userId, action, module, recordId, oldValue = null, newValue = null }) {
  return tx.auditLog.create({
    data: {
      userId: userId || null,
      action,
      module,
      recordId: recordId || null,
      oldValue,
      newValue,
    },
  });
}

export async function createInventoryMovement(
  tx,
  { productId, orderId = null, saleId = null, type, channel, quantity, previousStock, nextStock, note = null, userId = null },
) {
  return tx.inventoryMovement.create({
    data: {
      productId,
      orderId,
      saleId,
      type,
      channel,
      quantity,
      previousStock,
      nextStock,
      note,
      userId,
    },
  });
}
