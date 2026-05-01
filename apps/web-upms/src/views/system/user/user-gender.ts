import { $t } from '#/locales';

export enum GenderEnum {
  FEMALE='FEMALE',
  MALE='MALE',
  UNKNOWN='UNKNOWN',
}

export function getGender(gender: GenderEnum) {
  return (
    GenderOptions().find((option) => option.value === gender) || {
      label: gender,
      value: gender,
    }
  );
}

export function GenderOptions() {
  return [
    { label: $t('common.gender.male'), value: GenderEnum.MALE },
    { label: $t('common.gender.female'), value: GenderEnum.FEMALE },
    { label: $t('common.gender.unknown'), value: GenderEnum.UNKNOWN },
  ];
}
