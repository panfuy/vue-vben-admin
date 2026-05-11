import type { Recordable } from '@vben/types';

import type { VO } from '#/api/common/vo/base';

import { StatusEnum } from '#/api/common/enums/status';
import { requestClient } from '#/api/request';

export namespace TenantService {
  export interface TenantQueryVO extends VO.PageVO {
    id: string;
    name: string;
  }

  export interface TenantVO {
    [key: string]: any;
    id: string;
    name: string;
    shortName?: string;
    nickName?: string;
    avatarId?: string;
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
async function getTenantRefIdsById(type: string, roleId: string) {
  return requestClient.get<Array<string>>(
    `/tenant/getRefIdsById/${type}/${roleId}`,
  );
}

/**
 * 根据角色 ID 保存引用 ID 列表
 * @param type 引用类型（如：菜单、权限等）
 * @param roleId 角色 ID
 * @param refIds 引用ID列表
 */
async function saveTenantRef(
  type: string,
  roleId: string,
  refIds: Recordable<string>,
) {
  return requestClient.put(`/tenant/saveRef/${type}/${roleId}`, refIds);
}

/**
 * 检查租户 ID 是否存在
 * @param id 租户 ID
 * @returns 是否存在
 */
async function isTenantIdExists(id: string) {
  return requestClient.get<boolean>('/tenant/checkExists', {
    params: { id },
  });
}

/**
 * 检查租户名称是否已存在
 * @param name 租户名称
 * @param id 租户 ID
 * @returns 是否存在
 */
async function isTenantNameExists(
  name: string,
  id?: TenantService.TenantVO['id'],
) {
  return requestClient.get<boolean>('/tenant/checkExists', {
    params: { id, name },
  });
}

/**
 * 获取租户列表数据
 */
async function getTenantListPage(
  params: Recordable<TenantService.TenantQueryVO>,
) {
  return requestClient.post<Array<TenantService.TenantVO>>(
    '/tenant/queryByPage',
    params,
  );
}

/**
 * 创建租户
 * @param data 租户数据
 */
async function createTenant(data: Partial<TenantService.TenantVO>) {
  return requestClient.put('/tenant/save', data);
}

/**
 * 更新租户
 *
 * @param data 租户数据
 */
async function updateTenant(data: Partial<TenantService.TenantVO>) {
  return requestClient.put('/tenant/update', data);
}

/**
 * 删除租户
 * @param id 租户 ID
 */
async function deleteTenant(id: string) {
  return requestClient.delete(`/tenant/delete/${id}`);
}

export {
  createTenant,
  deleteTenant,
  getTenantListPage,
  getTenantRefIdsById,
  isTenantIdExists,
  isTenantNameExists,
  saveTenantRef,
  updateTenant,
};
