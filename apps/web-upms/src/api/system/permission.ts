import type { Recordable } from '@vben/types';

import type { Common } from '#/api/common/vo/base-query';

import { requestClient } from '#/api/request';

export namespace PermissionService {
  export interface PermissionQueryVO extends Common.BasePageVO {
    code: string;
    /** 权限类型 */
    type: string;
  }
export interface PermissionVO {
    [key: string]: any;
    /** 子级 */
    children?: PermissionVO[];
    /** 权限ID */
    id: string;
    /** 权限编码 */
    code: string;
    /** 权限描述 */
    description: string;
    /** 父级ID */
    parentId: string;
    /** 权限类型 */
    type: string;
  }
}

/**
 * 获取权限数据列表
 */
async function getPermissionList(params: Recordable<PermissionService.PermissionQueryVO>) {
  return requestClient.post<Array<PermissionService.PermissionVO>>(
    '/permission/queryByPage',
    params,
  );
}

/**
 * 获取权限树列表
 * @returns  权限树列表
 */
async function getPermissionTreeList() {
  return requestClient.get<Array<PermissionService.PermissionVO>>('/permission/tree');
}

/**
 * 获取所有根权限列表
 * @returns  集合
 */
async function getPermissionAllRootList() {
  return requestClient.get<Array<PermissionService.PermissionVO>>('/permission/getAllRoot');
}

/**
 * 校验权限code是否存在
 * @param code
 * @param id
 * @returns
 */
async function isPermissionCodeExists(code: string, type?: string, id?: PermissionService.PermissionVO['id']) {
  return requestClient.get<boolean>('/permission/checkExists', {
    params: { id, code, type },
  });
}

/**
 * 创建权限
 * @param data 权限数据
 */
async function createPermission(data: Omit<PermissionService.PermissionVO, 'children' | 'id'>) {
  return requestClient.put('/permission/save', data);
}

/**
 * 更新权限
 *
 * @param id 权限 ID
 * @param data 权限数据
 */
async function updatePermission(
  data: Omit<PermissionService.PermissionVO, 'children'>,
) {
  return requestClient.put(`/permission/update`, data);
}

/**
 * 删除权限
 * @param id 权限 ID
 */
async function deletePermission(id: string) {
  return requestClient.delete(`/permission/delete/${id}`);
}

export {
  createPermission,
  deletePermission,
  getPermissionAllRootList,
  getPermissionList,
  getPermissionTreeList,
  isPermissionCodeExists,
  updatePermission,
};
