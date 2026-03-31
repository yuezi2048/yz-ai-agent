// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 公司开票金额饼形图数据 POST /api/bi/company/invoice/pie */
export async function queryCompanyInvoiceAmountRatioUsingPost(
  body: API.DataStatisticsQueryDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>("/api/bi/company/invoice/pie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 公司开票金额、收款金额、欠款金额分类统计 POST /api/bi/company/statistics */
export async function companyStatisticsUsingPost(
  body: API.DataStatisticsQueryDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseCompanyInvoiceStatisticsVO_>(
    "/api/bi/company/statistics",
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
