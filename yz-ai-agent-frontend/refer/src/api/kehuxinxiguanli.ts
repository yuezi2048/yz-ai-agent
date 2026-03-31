// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 添加客户信息 POST /api/client/add */
export async function addClientUsingPost(
  body: API.ClientAddDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/client/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 判断客户是否存在 POST /api/client/check/exists */
export async function existsClientUsingPost(
  body: API.ExistsRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseExistsVo_>("/api/client/check/exists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取客户公司名称列表 GET /api/client/company/names */
export async function getClientCompanyNamesUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseSetString_>("/api/client/company/names", {
    method: "GET",
    ...(options || {}),
  });
}

/** 删除客户信息（逻辑删除） POST /api/client/delete */
export async function deleteClientUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/client/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据id获取客户信息 GET /api/client/get */
export async function getClientByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClientByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseClient_>("/api/client/get", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/**  获取客户列表（分页查询 POST /api/client/list/page */
export async function listClientByPageUsingPost(
  body: API.ClientPageDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseClientPageVo_>("/api/client/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据客户公司名称获取客户姓名和ID列表 POST /api/client/names/by/company */
export async function getUserNameByCompanyNameUsingPost(
  body: API.CompanyNameDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListUserNameByCompanyNameVo_>(
    "/api/client/names/by/company",
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

/** 更新客户信息 POST /api/client/update */
export async function updateClientUsingPost(
  body: API.ClientUpdateDto,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/client/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
