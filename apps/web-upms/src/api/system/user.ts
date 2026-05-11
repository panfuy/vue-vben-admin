import type { Recordable } from '@vben/types';

import type { VO } from '#/api/common/vo/base';

import { StatusEnum } from '#/api/common/enums/status';
import { requestClient } from '#/api/request';

export namespace UserService {
  export interface UserQueryVO extends VO.PageVO {
    [key: string]: any;
    condition: string | undefined;
    name?: string;
  }

  export interface UserVO {
    [key: string]: any;
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    email?: string;
    phone?: string;
    avatarId?: string;
    source?: string;
    status: StatusEnum;
    remark?: string;
  }
}

/**
 * 检查用户是否存在
 * @param id 用户 ID
 * @returns 是否存在
 */
async function isUserExists(id: string) {
  return requestClient.get<boolean>('/user/checkExists', {
    params: { id },
  });
}

/**
 * 查询用户列表
 * @param params 查询参数
 * @returns 用户列表
 */
async function getUserListPage(params: Recordable<UserService.UserQueryVO>): Promise<VO.PageVO<UserService.UserVO>> {
  return requestClient.post<VO.PageVO<UserService.UserVO>>(
    '/user/queryByPage',
    params,
  );
}
/**
 * 根据ID查询用户集合
 * @param ids 集合
 * @returns 用户列表
 */
async function getUserListByIds(ids: string[]) {
  return requestClient.post<Array<UserService.UserVO>>(
    '/user/queryListByIds',
    ids,
  );
}

/**
 * 根据ID 获取引用 ID 列表
 * @param type 引用类型（如：菜单、权限等）
 * @param roleId 角色 ID
 * @returns 引用ID列表
 */
async function getUserRefIdsById(type: string, userId: string) {
  return requestClient.get<Array<string>>(
    `/user/getRefIdsById/${type}/${userId}`,
  );
}

/**
 * 根据 ID 保存引用 ID 列表
 * @param type 引用类型（如：菜单、权限等）
 * @param userId 用户 ID
 * @param refIds 引用ID列表
 */
async function saveUserRef(
  type: string,
  userId: string,
  refIds: Recordable<string>,
) {
  return requestClient.put(`/user/saveRef/${type}/${userId}`, refIds);
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(data: Partial<UserService.UserVO>) {
  return requestClient.put('/user/save', data);
}

/**
 * 更新用户
 *
 * @param data 用户数据
 */
async function updateUser(data: Partial<UserService.UserVO>) {
  return requestClient.put('/user/update', data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
async function deleteUser(id: string) {
  return requestClient.delete(`/user/delete/${id}`);
}

export {
  createUser,
  deleteUser,
  getUserListByIds,
  getUserListPage,
  getUserRefIdsById,
  isUserExists,
  saveUserRef,
  updateUser,
};
