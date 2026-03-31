// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 添加发票信息 POST /api/invoice/base/add */
export async function addInvoiceBaseUsingPost(
  body: API.InvoiceAddDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/invoice/base/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新发票信息 POST /api/invoice/base/update */
export async function updateClientUsingPost1(
  body: API.InvoiceUpdateDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/invoice/base/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除发票信息 POST /api/invoice/delete */
export async function deleteClientUsingPost1(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/invoice/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据ID获取发票信息 POST /api/invoice/getById */
export async function getByIdUsingPost(
  body: API.InvoiceBaseId,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInvoiceBase_>("/api/invoice/getById", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 入账（添加到款记录） POST /api/invoice/payment/add */
export async function addPaymentUsingPost(
  body: API.InvoicePaymentDto[],
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListLong_>("/api/invoice/payment/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 撤销到款（逻辑删除） POST /api/invoice/payment/delete */
export async function cancelPaymentUsingPost(
  body: API.InvoiceBaseId,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/invoice/payment/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 分页查询发票信息 POST /api/invoice/query */
export async function queryInvoicePageUsingPost(
  body: API.InvoicePageDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInvoicePageVO_>("/api/invoice/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 创建红字发票（冲红） POST /api/invoice/red/create */
export async function addRedInvoiceUsingPost(
  body: API.RedInvoiceDtoDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/invoice/red/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
