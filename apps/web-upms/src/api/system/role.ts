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
 * 根据角色 ID 获取引用 ID 列表
 * @param type 引用类型（如：菜单、权限等）
 * @param roleId 角色 ID
 * @returns 引用ID列表
 */
async function getRefIdsById(type: string, roleId: string) {
  return requestClient.get<Array<string>>(
    `/role/getRefIdsById/${type}/${roleId}`,
  );
}

/**
 * 根据角色 ID 保存引用 ID 列表
 * @param type 引用类型（如：菜单、权限等）
 * @param roleId 角色 ID
 * @param refIds 引用ID列表
 */
async function saveRef(
  type: string,
  roleId: string,
  refIds: Recordable<string>,
) {
  return requestClient.put(`/role/saveRef/${type}/${roleId}`, refIds);
}

/**
 * 获取角色列表数据
 */
async function getRoleListPage(params: Recordable<RoleService.RoleQueryVO>) {
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
 * @param data 角色数据
 */
async function updateRole(data: Partial<RoleService.RoleVO>) {
  return requestClient.put('/role/update', data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  return requestClient.delete(`/role/delete/${id}`);
}

export {
  createRole,
  deleteRole,
  getRefIdsById,
  getRoleListPage,
  saveRef,
  updateRole,
};
