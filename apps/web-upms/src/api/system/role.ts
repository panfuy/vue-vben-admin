import type { Recordable } from '@vben/types';

import type { Common } from '#/api/common/vo/base-query';

import { StatusEnum } from '#/api/common/enums/status';
import { requestClient } from '#/api/request';

export namespace RoleService {
  export interface RoleQueryVO extends Common.BasePageVO {
    code: string;
    name: string;
  }

  export interface RoleVO {
    [key: string]: any;
    id: string;
    code: string;
    name: string;
    description?: string;
    remark?: string;
    source?: string;
    status: StatusEnum;
  }
}

/**
 * 获取角色列表数据
 */
async function getRoleList(params: Recordable<RoleService.RoleQueryVO>) {
  return requestClient.post<Array<RoleService.RoleVO>>(
    '/role/queryByPage',
    params,
  );
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: Omit<RoleService.RoleVO, 'id'>) {
  return requestClient.put('/role/save', data);
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(id: string, data: Omit<RoleService.RoleVO, 'id'>) {
  return requestClient.put(`/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  return requestClient.delete(`/role/${id}`);
}

export { createRole, deleteRole, getRoleList, updateRole };
