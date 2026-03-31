// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 创建公司 POST /api/company/add */
export async function addCompanyUsingPost(
  body: API.CompanyAddDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/company/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有可用公司名称和ID GET /api/company/allCompanyIdName */
export async function getAllCompanyIdNameUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListCompanyIdNameVO_>(
    "/api/company/allCompanyIdName",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** 获取所有可用公司名称 GET /api/company/allName */
export async function allCompanyNameUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListString_>("/api/company/allName", {
    method: "GET",
    ...(options || {}),
  });
}

/** 判断公司是否存在 POST /api/company/check/exists */
export async function checkExistsUsingPost(
  body: API.CompanyExistsRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseExistsCompanyVo_>(
    "/api/company/check/exists",
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

/** 删除公司(逻辑删除) POST /api/company/delete */
export async function deleteCompanyUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/company/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取公司列表（分页查询） POST /api/company/list/page */
export async function listCompanyByPageUsingPost(
  body: API.CompanyPageDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseCompanyPageVO_>("/api/company/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新公司信息 POST /api/company/update */
export async function updateCompanyUsingPost(
  body: API.CompanyUpdateDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/company/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
