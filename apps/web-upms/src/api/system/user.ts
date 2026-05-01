import type { Recordable } from '@vben/types';

import type { Common } from '#/api/common/vo/base-query';

import { StatusEnum } from '#/api/common/enums/status';
import { requestClient } from '#/api/request';

export namespace UserService {
  export interface UserQueryVO extends Common.BasePageVO {
    id: string;
    name: string;
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
async function getUserListPage(params: Recordable<UserService.UserQueryVO>) {
  return requestClient.post<Array<UserService.UserVO>>(
    '/user/queryByPage',
    params,
  );
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

export { createUser, deleteUser, getUserListPage, isUserExists, updateUser };
