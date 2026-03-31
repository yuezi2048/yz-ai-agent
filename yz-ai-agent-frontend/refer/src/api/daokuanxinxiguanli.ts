// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 获取发票到款列表（分页查询） POST /api/invoicefinish/list/page */
export async function listInvoiceFinishPageUsingPost(
  body: API.InvoiceFinishPageDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseInvoiceFinishPageVO_>(
    "/api/invoicefinish/list/page",
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
