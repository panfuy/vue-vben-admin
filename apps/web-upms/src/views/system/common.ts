import type { RoleService } from '#/api/system/role';
import type { UserService } from '#/api/system/user';

export type { RoleService, UserService };

/**
 * 页面展示内容项对象
 */
export namespace Item {
  /**
   * 用户信息
   */
  export interface User {
    id: string;
    title: string;
    email: string;
    phone: string;
    roles?: Role[];
    /**
     * 标识：新增、修改、删除
     */
    action?: ActionType;
  }

  /**
   * 角色信息
   */
  export interface Role {
    id: string;
    title: string;
    description: string;
    /**
     * 标识：新增、修改、删除
     */
    action?: ActionType;
  }

  /**
   * 操作类型
   */
  export enum ActionType {
    CREATE = 'create',
    DELETE = 'delete',
    UPDATE = 'update',
  }
}

/**
 * 判断是否可以修改
 * @param row 数据来源
 */
export function isRecordEdit(row: any) {
  if (row.source && row.source !== '') {
    return false; // 不可以修改
  }
  return true; // 可修改
}

/**
 * 将用户信息转换为展示项
 * @param records 用户信息
 * @returns 展示项
 */
export function convertUserItem(records: UserService.UserVO[]): Item.User[] {
  return (
    records?.map((item: UserService.UserVO) => ({
      id: item.id,
      title:
        item.lastName || item.firstName
          ? `${item.name} (${item.lastName} ${item.firstName})`
          : item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      roles: convertRoleItem(item.roleList || []),
    })) || []
  );
}

/**
 * 将角色信息转换为展示项
 * @param records 角色信息
 * @returns 展示项
 */
export function convertRoleItem(records: RoleService.RoleVO[]): Item.Role[] {
  return (
    records?.map((item: RoleService.RoleVO) => ({
      id: item.id,
      title: `${item.name} (${item.code})`,
      description: item.description || '',
    })) || []
  );
}
