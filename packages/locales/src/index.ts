import {
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  setupI18n,
} from './i18n';

// const $t = i18n.global.t;
/**
 * 翻译函数（若是传入了空的key会返回空字符串）
 *
 * @param key 翻译key
 * @param option  翻译选项
 * @returns 翻译结果
 */
function $t(key: null | string | undefined, option?: unknown) {
  if (key === null || key === undefined || key === '') {
    return '';
  }
  return i18n.global.t(key, option as any);
}
/**
 * 检查翻译key是否存在
 */
const $te = i18n.global.te;

export {
  $t,
  $te,
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  setupI18n,
};
export {
  type ImportLocaleFn,
  type LocaleSetupOptions,
  type SupportedLanguagesType,
} from './typing';
export type { CompileError } from '@intlify/core-base';

export { useI18n } from 'vue-i18n';

export type { Locale } from 'vue-i18n';
