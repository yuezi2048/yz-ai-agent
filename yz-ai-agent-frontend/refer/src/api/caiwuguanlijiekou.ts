// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 银行收支明细添加 POST /api/finance/bank/transaction/add */
export async function addBankTransactionUsingPost(
  body: API.BankTransactionAddDto_,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListLong_>(
    "/api/finance/bank/transaction/add",
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

/** 删除银行收支明细 POST /api/finance/bank/transaction/delete */
export async function deleteBankTransactionUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>(
    "/api/finance/bank/transaction/delete",
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

/** 计算银行收支记录剩余可用金额 POST /api/finance/bank/transaction/list */
export async function queryBankTransactionWithremainAmountUsingPost(
  body: API.BankTransactionWithInvoicesDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBankTransactionRemainingAmountVO_>(
    "/api/finance/bank/transaction/list",
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

/** 根据银行id列表返回银行信息 POST /api/finance/bank/transaction/list/by/ids */
export async function listBankTransactionByIdsUsingPost(
  body: number[],
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListBankTransactionRelatedInvoiceVO_>(
    "/api/finance/bank/transaction/list/by/ids",
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

/** 银行收支明细分页查询 POST /api/finance/bank/transaction/list/page */
export async function listTransactionByPageUsingPost(
  body: API.TransactionPageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseTransactionPageVO_>(
    "/api/finance/bank/transaction/list/page",
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

/** 查询银行收支记录关联的发票信息 POST /api/finance/bank/transaction/remaining/amount */
export async function queryBankTransactionWithInvoicesUsingPost(
  body: API.BankTransactionWithInvoicesDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBankTransactionWithInvoicesVO_>(
    "/api/finance/bank/transaction/remaining/amount",
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

/** 已到款记录同步登记发票入账 POST /api/finance/bank/transaction/sync/invoic */
export async function syncInvoiceUsingPost(
  body: API.BankTransactionSyncInvoiceDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBankTransactionSyncInvoiceVO_>(
    "/api/finance/bank/transaction/sync/invoic",
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

/** 更改银行收支明细 POST /api/finance/bank/transaction/update */
export async function updateBankTransactionUsingPost(
  body: API.BankTransactionUpdateDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>(
    "/api/finance/bank/transaction/update",
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

/** 添加进项发票 POST /api/finance/input/invoice/add */
export async function addInputInvoiceUsingPost(
  body: API.InputInvoiceAddDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/finance/input/invoice/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/**  删除进项发票（逻辑删除） POST /api/finance/input/invoice/delete */
export async function deleteInputInvoiceUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>(
    "/api/finance/input/invoice/delete",
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

/**  进项发票分页查询 POST /api/finance/input/invoice/list/page */
export async function listInputInvoiceByPageUsingPost(
  body: API.InputVoicePageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInputVoicePageVO_>(
    "/api/finance/input/invoice/list/page",
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

/**  更新进项发票信息 POST /api/finance/input/invoice/update */
export async function updateInputInvoiceUsingPost(
  body: API.InputInvoiceAddDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>(
    "/api/finance/input/invoice/update",
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

/** 进项发票出账（添加/更新出账记录，支持批量） POST /api/finance/input/payment/add */
export async function addInputPaymentUsingPost(
  body: API.InputPaymentDto[],
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInputPaymentResultVo_>(
    "/api/finance/input/payment/add",
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

/** 撤销出账（逻辑删除，删除进项发票的所有出账记录） POST /api/finance/input/payment/cancel */
export async function cancelInputPaymentUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>(
    "/api/finance/input/payment/cancel",
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

/** 查询进项发票对应的出账记录 POST /api/finance/input/payment/list */
export async function queryInputPaymentUsingPost(
  body: API.InputPaymentQueryDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInputPaymentRelatedVo_>(
    "/api/finance/input/payment/list",
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
