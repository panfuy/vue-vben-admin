import type { VO } from '#/api/common/vo/base';

import { StatusEnum } from '#/api/common/enums/status';
import { requestClient } from '#/api/request';

export namespace RoleService {
  export interface RoleQueryVO extends VO.PageVO {
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
async function getRoleRefIdsById(type: string, roleId: string) {
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
async function saveRoleRef(
  type: string,
  roleId: string,
  refIds: Array<string>,
) {
  return requestClient.put(`/role/saveRef/${type}/${roleId}`, refIds);
}

/**
 * 检查角色编码是否存在
 * @param code 角色编码
 * @returns 是否存在
 */
async function isRoleCodeExists(code: string) {
  return requestClient.get<boolean>('/role/checkExists', {
    params: { code },
  });
}

/**
 * 获取角色列表数据
 */
async function getRoleListPage(
  params: Partial<RoleService.RoleQueryVO>,
): Promise<VO.PageVO<RoleService.RoleVO>> {
  return requestClient.post<VO.PageVO<RoleService.RoleVO>>(
    '/role/queryByPage',
    params,
  );
}
/**
 * 根据ID查询角色集合
 * @param ids 集合
 * @returns 角色列表
 */
async function getRoleListByIds(ids: Array<string>) {
  return requestClient.post<Array<RoleService.RoleVO>>(
    '/role/queryListByIds',
    ids,
  );
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: Omit<RoleService.RoleVO, 'children' | 'id'>) {
  return requestClient.put('/role/save', data);
}

/**
 * 更新角色
 *
 * @param data 角色数据
 */
async function updateRole(data: Omit<RoleService.RoleVO, 'children'>) {
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
  getRoleListByIds,
  getRoleListPage,
  getRoleRefIdsById,
  isRoleCodeExists,
  saveRoleRef,
  updateRole,
};
