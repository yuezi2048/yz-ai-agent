// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 添加供应商 POST /api/supplier/add */
export async function addSupplierUsingPost(
  body: API.SupplierAddDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/supplier/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 判断供应商是否存在 POST /api/supplier/check/exists */
export async function existsSupplierUsingPost(
  body: API.ExistsRequestSupplier,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseExistsVoSupplier_>(
    "/api/supplier/check/exists",
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

/** 获取供应商公司名称列表 GET /api/supplier/company/names */
export async function getSupplierCompanyNamesUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListString_>("/api/supplier/company/names", {
    method: "GET",
    ...(options || {}),
  });
}

/** 删除供应商（逻辑删除） POST /api/supplier/delete */
export async function deleteSupplierUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/supplier/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取供应商列表（分页查询） POST /api/supplier/list/page */
export async function listSupplierUsingPost(
  body: API.SupplierQueryDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseSupplierPageVO_>("/api/supplier/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据供应商公司名称获取供应商姓名和ID列表 POST /api/supplier/names/by/company */
export async function getSupplierNameByCompanyNameUsingPost(
  body: API.CompanyNameDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListUserNameByCompanyNameVo_>(
    "/api/supplier/names/by/company",
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

/** 更改供应商 POST /api/supplier/update */
export async function updateSupplierUsingPost(
  body: API.SupplierUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/supplier/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
