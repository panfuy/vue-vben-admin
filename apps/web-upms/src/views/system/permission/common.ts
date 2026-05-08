import { $t } from '#/locales';

export enum TypeEnum {
  OPERATION = 'OPERATION',
  RESOURCE = 'RESOURCE',
  UNKNOWN = 'UNKNOWN',
}

export function getPermissionTypeOptions() {
  return [
    { color: 'default', label: $t('system.permission.type.resource'), value: TypeEnum.RESOURCE },
    {
      color: 'success',
      label: $t('system.permission.type.operation'),
      value: TypeEnum.OPERATION,
    },
    { color: 'warning', label: $t('system.permission.type.unknown'), value: TypeEnum.UNKNOWN },
  ];
}
