import { $t } from '#/locales';

export enum SourceEnum {
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

export function getSource(status: SourceEnum) {
  return (
    SourceOptions().find((option) => option.value === status) || {
      label: status,
      value: status,
    }
  );
}

export function SourceOptions() {
  return [
    {
      label: $t('common.internal'),
      value: SourceEnum.INTERNAL,
      color: 'success',
    },
    {
      label: $t('common.unknown'),
      value: SourceEnum.UNKNOWN,
      color: 'error',
    },
  ];
}
