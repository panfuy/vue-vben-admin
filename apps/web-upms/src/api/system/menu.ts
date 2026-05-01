import type { Recordable } from '@vben/types';

import type { Common } from '#/api/common/vo/base-query';

import { requestClient } from '#/api/request';

export namespace MenuService {
  export interface MenuQueryVO extends Common.BasePageVO {
    code: string;
    name: string;
  }

  /** 徽标颜色集合 */
  export const BadgeVariants = [
    'default',
    'destructive',
    'primary',
    'success',
    'warning',
  ] as const;
  /** 徽标类型集合 */
  export const BadgeTypes = ['dot', 'normal'] as const;
  /** 菜单类型集合 */
  export const MenuTypes = [
    'CATALOG',
    'MENU',
    'EMBEDDED',
    'LINK',
    'BUTTON',
  ] as const;
  /** 系统菜单 */
  export interface MenuVO {
    [key: string]: any;
    /** 后端权限标识 */
    authCode: string;
    /** 子级 */
    children?: MenuVO[];
    /** 组件 */
    component?: string;
    /** 菜单ID */
    id: string;
    /** 菜单名称 */
    name: string;
    /** 路由路径 */
    path: string;
    /** 父级ID */
    parentId: string;
    /** 重定向 */
    redirect?: string;
    /** 菜单类型 */
    type: (typeof MenuTypes)[number];
    /** 菜单标题 */
    title?: string;
    /** 菜单元数据 */
    meta?: {
      /** 激活时显示的图标 */
      activeIcon?: string;
      /** 作为路由时，需要激活的菜单的Path */
      activePath?: string;
      /** 固定在标签栏 */
      affixTab?: boolean;
      /** 在标签栏固定的顺序 */
      affixTabOrder?: number;
      /** 徽标内容(当徽标类型为normal时有效) */
      badge?: string;
      /** 徽标类型 */
      badgeType?: (typeof BadgeTypes)[number];
      /** 徽标颜色 */
      badgeVariants?: (typeof BadgeVariants)[number];
      /** 在菜单中隐藏下级 */
      hideChildrenInMenu?: boolean;
      /** 在面包屑中隐藏 */
      hideInBreadcrumb?: boolean;
      /** 在菜单中隐藏 */
      hideInMenu?: boolean;
      /** 在标签栏中隐藏 */
      hideInTab?: boolean;
      /** 菜单图标 */
      icon?: string;
      /** 内嵌Iframe的URL */
      iframeSrc?: string;
      /** 是否缓存页面 */
      keepAlive?: boolean;
      /** 外链页面的URL */
      link?: string;
      /** 同一个路由最大打开的标签数 */
      maxNumOfOpenTab?: number;
      /** 无需基础布局 */
      noBasicLayout?: boolean;
      /** 是否在新窗口打开 */
      openInNewWindow?: boolean;
      /** 菜单排序 */
      order?: number;
      /** 额外的路由参数 */
      query?: Recordable<any>;
    };
  }
}

/**
 * 获取菜单数据列表
 */
async function getMenuList(params: Recordable<MenuService.MenuQueryVO>) {
  return requestClient.post<Array<MenuService.MenuVO>>(
    '/menu/queryByPage',
    params,
  );
}

async function getMenuTreeList() {
  return requestClient.get<Array<MenuService.MenuVO>>('/menu/tree');
}

async function isMenuNameExists(name: string, id?: MenuService.MenuVO['id']) {
  return requestClient.get<boolean>('/menu/checkExists', {
    params: { id, name },
  });
}

async function isMenuPathExists(path: string, id?: MenuService.MenuVO['id']) {
  return requestClient.get<boolean>('/menu/checkExists', {
    params: { id, path },
  });
}

/**
 * 创建菜单
 * @param data 菜单数据
 */
async function createMenu(data: Omit<MenuService.MenuVO, 'children' | 'id'>) {
  return requestClient.put('/menu/save', data);
}

/**
 * 更新菜单
 *
 * @param id 菜单 ID
 * @param data 菜单数据
 */
async function updateMenu(
  id: string,
  data: Omit<MenuService.MenuVO, 'children' | 'id'>,
) {
  return requestClient.put(`/menu/update/${id}`, data);
}

/**
 * 删除菜单
 * @param id 菜单 ID
 */
async function deleteMenu(id: string) {
  return requestClient.delete(`/menu/delete/${id}`);
}

export {
  createMenu,
  deleteMenu,
  getMenuList,
  getMenuTreeList,
  isMenuNameExists,
  isMenuPathExists,
  updateMenu,
};
