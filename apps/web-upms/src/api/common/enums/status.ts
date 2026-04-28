import { $t } from '#/locales';

export enum StatusEnum {
  DISABLE = 'DISABLE',
  ENABLED = 'ENABLED',
}

export const StatusMap = {
  [StatusEnum.ENABLED]: $t('common.enabled'),
  [StatusEnum.DISABLE]: $t('common.disabled'),
};

export const StatusOptions = [
  { label: $t('common.enabled'), value: StatusEnum.ENABLED },
  { label: $t('common.disabled'), value: StatusEnum.DISABLE },
];
