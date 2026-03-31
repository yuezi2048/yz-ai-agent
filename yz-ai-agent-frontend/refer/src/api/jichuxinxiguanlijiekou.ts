// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 添加进票用途 POST /api/base/invoice/purpose/add */
export async function addInvoicePurposeUsingPost(
  body: API.InvoicePurposeDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/base/invoice/purpose/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除进票用途 POST /api/base/invoice/purpose/delete */
export async function deleteInvoicePurposeUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/invoice/purpose/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有启用的进票用途列表（用于下拉选择） GET /api/base/invoice/purpose/list/enabled */
export async function queryInvoicePurposeListEnabledUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseList_>(
    "/api/base/invoice/purpose/list/enabled",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** 获取进票用途列表（分页查询） POST /api/base/invoice/purpose/list/page */
export async function queryInvoicePurposePageUsingPost(
  body: API.InvoicePurposePageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInvoicePurposePageVO_>(
    "/api/base/invoice/purpose/list/page",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 更新进票用途 POST /api/base/invoice/purpose/update */
export async function updateInvoicePurposeUsingPost(
  body: API.InvoicePurposeUpateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/invoice/purpose/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 创建发票性质 POST /api/base/invoice/type/add */
export async function addInvoiceTypeUsingPost(
  body: API.InvoiceTypeDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/base/invoice/type/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除发票性质 POST /api/base/invoice/type/delete */
export async function deleteInvoiceTypeUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/invoice/type/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有启用的发票性质列表（用于下拉选择） POST /api/base/invoice/type/list/enabled */
export async function queryInvoiceTypeListEnabledUsingPost(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseList_>("/api/base/invoice/type/list/enabled", {
    method: "POST",
    ...(options || {}),
  });
}

/** 获取发票性质列表（分页查询） POST /api/base/invoice/type/list/page */
export async function queryInvoiceTypePageUsingPost(
  body: API.InvoiceTypePageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInvoiceTypePageVO_>(
    "/api/base/invoice/type/list/page",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 更新发票性质 POST /api/base/invoice/type/update */
export async function updateInvoiceTypeUsingPost(
  body: API.InvoiceUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/invoice/type/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 创建标记 POST /api/base/mark/add */
export async function addMarkUsingPost(
  body: API.MarkDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/base/mark/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除标记（逻辑删除） POST /api/base/mark/delete */
export async function deleteMarkUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/mark/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有启用的标记列表（用于下拉选择） POST /api/base/mark/list/enabled */
export async function queryMarkListEnabledUsingPost(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseList_>("/api/base/mark/list/enabled", {
    method: "POST",
    ...(options || {}),
  });
}

/** 获取标记列表（分页查询） POST /api/base/mark/list/page */
export async function queryMarkPageUsingPost(
  body: API.MarkPageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseMarkPageVO_>("/api/base/mark/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新标记 POST /api/base/mark/update */
export async function updateMarkUsingPost(
  body: API.MarkConfigUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/mark/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 创建权限 POST /api/base/permission/add */
export async function addPermissionUsingPost(
  body: API.PermissionDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/base/permission/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除权限 POST /api/base/permission/delete */
export async function deletePermissionUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/permission/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有启用的权限列表（用于下拉选择） GET /api/base/permission/list/enabled */
export async function queryPermissionListEnabledUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseList_>("/api/base/permission/list/enabled", {
    method: "GET",
    ...(options || {}),
  });
}

/**  获取权限列表（分页查询） POST /api/base/permission/list/page */
export async function queryPermissionPageUsingPost(
  body: API.PermissionPageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePermissionPageVO_>(
    "/api/base/permission/list/page",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 更新权限 POST /api/base/permission/update */
export async function updatePermissionUsingPost(
  body: API.PermissionUpateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/permission/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加转账方式 POST /api/base/transfer/method/add */
export async function addTransferMethodUsingPost(
  body: API.TransferMethodDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/base/transfer/method/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除转账方式 POST /api/base/transfer/method/delete */
export async function deleteTransferMethodUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/transfer/method/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取转账方式列表（分页查询） POST /api/base/transfer/method/list/page */
export async function queryTransferMethodPageUsingPost(
  body: API.TransferMethodPageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseTransferMethodPageVo_>(
    "/api/base/transfer/method/list/page",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 更新转账方式 POST /api/base/transfer/method/update */
export async function updateTransferMethodUsingPost(
  body: API.TransferMethodUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/base/transfer/method/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
