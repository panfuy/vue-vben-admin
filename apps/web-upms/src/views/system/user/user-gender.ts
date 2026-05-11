import { $t } from '#/locales';

export enum GenderEnum {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  UNKNOWN = 'UNKNOWN',
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
    {
      label: $t('common.gender.male'),
      value: GenderEnum.MALE,
      color: 'success',
    },
    {
      label: $t('common.gender.female'),
      value: GenderEnum.FEMALE,
      color: 'error',
    },
    {
      label: $t('common.unknown'),
      value: GenderEnum.UNKNOWN,
      color: 'warning',
    },
  ];
}
