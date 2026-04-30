import { $t } from '#/locales';

export enum StatusEnum {
  DISABLED = 'DISABLED',
  ENABLED = 'ENABLED',
}

export function getStatus(status: StatusEnum) {
  return (
    StatusOptions().find((option) => option.value === status) || {
      label: status,
      value: status,
    }
  );
}

export function StatusOptions() {
  return [
    { label: $t('common.enabled'), value: StatusEnum.ENABLED },
    { label: $t('common.disabled'), value: StatusEnum.DISABLED },
  ];
}
