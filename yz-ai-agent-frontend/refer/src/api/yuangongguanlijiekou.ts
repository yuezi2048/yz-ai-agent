// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 添加员工 POST /api/employee/add */
export async function addEmployeeUsingPost(
  body: API.EmployeeAddDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong_>("/api/employee/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 模糊匹配companyName的公司列表下的所有员工基本信息（ID、姓名、工号、公司信息） GET /api/employee/basic/info */
export async function getAllEmployeeBasicInfoUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAllEmployeeBasicInfoUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListEmployeeBasicInfoVO_>(
    "/api/employee/basic/info",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 判断员工是否存在 POST /api/employee/check/exists */
export async function existsEmployeeUsingPost(
  body: API.ExistsRequestEployee,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseExistsVoEmployee_>(
    "/api/employee/check/exists",
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

/** 删除员工（逻辑删除） POST /api/employee/delete */
export async function deleteEmployeeUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/employee/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前登录用户 GET /api/employee/get/login */
export async function getLoginUserUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseLoginUserVO_>("/api/employee/get/login", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取员工列表（分页查询） POST /api/employee/list/page */
export async function listEmployeeUsingPost(
  body: API.EmployeeQueryDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseEmployeePageVO_>("/api/employee/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 员工登录 POST /api/employee/login */
export async function userLoginUsingPost(
  body: API.UserLoginRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLoginUserVO_>("/api/employee/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 用户退出 POST /api/employee/logout */
export async function userLogoutUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>("/api/employee/logout", {
    method: "POST",
    ...(options || {}),
  });
}

/** 更改员工的权限 POST /api/employee/permission/update */
export async function updatePermissionUsingPost1(
  body: API.EmployeePermissionUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/employee/permission/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新员工信息 POST /api/employee/update */
export async function updateEmployeeUsingPost(
  body: API.EmployeeUpdateDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/employee/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 修改密码 POST /api/employee/updatePassword */
export async function updatePasswordUsingPost(
  body: API.UpdatePasswordRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/employee/updatePassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
