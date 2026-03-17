export function serializeOrder(order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    status: order.status.toLowerCase(),
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    trackingStatus: order.trackingStatus,
    couponCode: order.couponCode,
    couponDiscount: Number(order.couponDiscount || 0),
    total: Number(order.total || 0),
    lines: (order.lines || []).map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      discountPercent: line.discountPercent,
    })),
  };
}

export function serializeCoupon(coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type.toLowerCase(),
    value: Number(coupon.value),
    isActive: coupon.isActive,
    description: coupon.description,
    audience: coupon.audience.toLowerCase(),
    userEmail: coupon.userEmail || "",
  };
}

export function serializeSupportTicket(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt,
    messages: (ticket.messages || []).map((entry) => ({
      id: entry.id,
      authorRole: entry.user.role,
      authorEmail: entry.user.email,
      message: entry.message,
      createdAt: entry.createdAt,
    })),
  };
}

export function serializeComment(comment) {
  return {
    id: comment.id,
    userEmail: comment.user.email,
    message: comment.message,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.updatedAt?.getTime?.() !== comment.createdAt?.getTime?.(),
  };
}
