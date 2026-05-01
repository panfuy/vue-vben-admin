import { $t } from '#/locales';

export function getMenuTypeOptions() {
  return [
    {
      color: 'processing',
      label: $t('system.menu.type.catalog'),
      value: 'CATALOG',
    },
    { color: 'default', label: $t('system.menu.type.menu'), value: 'MENU' },
    { color: 'error', label: $t('system.menu.type.button'), value: 'BUTTON' },
    {
      color: 'success',
      label: $t('system.menu.type.embedded'),
      value: 'EMBEDDED',
    },
    { color: 'warning', label: $t('system.menu.type.link'), value: 'LINK' },
  ];
}

