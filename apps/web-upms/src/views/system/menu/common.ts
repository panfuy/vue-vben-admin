import { $t } from '#/locales';

export enum MenuTypeEnum {
  BUTTON = 'BUTTON',
  CATALOG = 'CATALOG',
  EMBEDDED = 'EMBEDDED',
  LINK = 'LINK',
  MENU = 'MENU',
}

export function getMenuTypeOptions() {
  return [
    {
      color: 'processing',
      label: $t('system.menu.type.catalog'),
      value: MenuTypeEnum.CATALOG,
    },
    {
      color: 'default',
      label: $t('system.menu.type.menu'),
      value: MenuTypeEnum.MENU,
    },
    {
      color: 'error',
      label: $t('system.menu.type.button'),
      value: MenuTypeEnum.BUTTON,
    },
    {
      color: 'success',
      label: $t('system.menu.type.embedded'),
      value: MenuTypeEnum.EMBEDDED,
    },
    {
      color: 'warning',
      label: $t('system.menu.type.link'),
      value: MenuTypeEnum.LINK,
    },
  ];
}

export const MenuTypeUtil = {
  /**
   * 判断传入的参数中是否至少存在一个有效的 MenuTypeEnum 枚举值
   * @param types 待检查的枚举值（或字符串）列表，可变参数
   * @returns 存在至少一个则返回 true，否则 false
   */
  isAnyExist: (...types: Array<MenuTypeEnum | string>): boolean => {
    if (types.length === 0) return false;
    const enumValues: string[] = Object.values(MenuTypeEnum);
    return types.some((type) => enumValues.includes(type));
  },

  /**
   * 判断传入的参数中是否全部都是有效的 MenuTypeEnum 枚举值
   * @param type 要检查的枚举值字符
   * @param types  待检查的枚举值（或字符串）列表，可变参数
   * @returns 存在返回true，否则false
   */
  isTypeExist: (
    type: string,
    ...types: Array<MenuTypeEnum | string>
  ): boolean => {
    if (types.length === 0) return false;
    return types.includes(type);
  },
};
