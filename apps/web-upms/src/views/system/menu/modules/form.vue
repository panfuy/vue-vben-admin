<script lang="ts" setup>
import type { ChangeEvent } from 'ant-design-vue/es/_util/EventInterface';

import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import { getPopupContainer } from '@vben/utils';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useVbenForm, z } from '#/adapter/form';
import { StatusEnum, StatusOptions } from '#/api/common/enums/status';
import {
  createMenu,
  getMenuTreeList,
  isMenuNameExists,
  isMenuPathExists,
  MenuService,
  updateMenu,
} from '#/api/system/menu';
import { $t } from '#/locales';
import { componentKeys, componentPaths } from '#/router/routes';

import { getMenuTypeOptions, MenuTypeEnum, MenuTypeUtil } from '../common';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<MenuService.MenuVO>();
const titleSuffix = ref<string>();
const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getMenuTypeOptions(),
      optionType: 'button',
    },
    defaultValue: MenuTypeEnum.MENU,
    fieldName: 'type',
    formItemClass: 'col-span-2 md:col-span-2',
    label: $t('system.menu.field.type'),
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('system.menu.field.name'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.field.name'), 2]))
      .max(30, $t('ui.formRules.maxLength', [$t('system.menu.field.name'), 30]))
      .refine(
        async (value: string) => {
          if (!value || value.length === 0) {
            return true;
          }
          return !(await isMenuNameExists(value, formData.value?.id));
        },
        (value) => ({
          message: $t('ui.formRules.alreadyExists', [
            $t('system.menu.field.name'),
            value,
          ]),
        }),
      ),
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuTreeList,
      class: 'w-full',
      filterTreeNode(input: string, node: Recordable<any>) {
        if (!input || input.length === 0) {
          return true;
        }
        const title: string = node.title ?? '';
        if (!title) return false;
        return title.includes(input) || $t(title).includes(input);
      },
      getPopupContainer,
      labelField: 'title',
      showSearch: true,
      treeDefaultExpandAll: true,
      valueField: 'id',
      childrenField: 'children',
    },
    fieldName: 'parentId',
    label: $t('system.menu.field.parent'),
    renderComponentContent() {
      return {
        title({ label, meta }: { label: string; meta: Recordable<any> }) {
          const coms = [];
          if (!label) return '';
          if (meta?.icon) {
            coms.push(h(IconifyIcon, { class: 'size-4', icon: meta.icon }));
          }
          coms.push(h('span', { class: '' }, $t(label || '')));
          return h('div', { class: 'flex items-center gap-1' }, coms);
        },
      };
    },
  },
  {
    component: 'Input',
    componentProps() {
      // 不需要处理多语言时就无需这么做
      return {
        ...(titleSuffix.value && { addonAfter: titleSuffix.value }),
        onChange({ target: { value } }: ChangeEvent) {
          titleSuffix.value = value && $te(value) ? $t(value) : undefined;
        },
      };
    },
    fieldName: 'title',
    label: $t('system.menu.field.title'),
    rules: 'required',
  },

  {
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      options: componentPaths.map((v) => ({ value: v })),
    },
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type,
        MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'path',
    label: $t('system.menu.field.path'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.field.path'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.field.path'), 100]))
      .refine(
        (value: string) => {
          return value.startsWith('/');
        },
        $t('ui.formRules.startWith', [$t('system.menu.field.path'), '/']),
      )
      .refine(
        async (value: string) => {
          if (!value || value.length === 0) {
            return true;
          }
          return !(await isMenuPathExists(value, formData.value?.id));
        },
        (value) => ({
          message: $t('ui.formRules.alreadyExists', [
            $t('system.menu.field.path'),
            value,
          ]),
        }),
      ),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.EMBEDDED, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'activePath',
    help: $t('system.menu.message.activePathHelp'),
    label: $t('system.menu.field.activePath'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.field.path'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.field.path'), 100]))
      .refine(
        (value: string) => {
          return value.startsWith('/');
        },
        $t('ui.formRules.startWith', [$t('system.menu.path'), '/']),
      )
      .refine(async (value: string) => {
        if (!value || value.length === 0) {
          return true;
        }
        return await isMenuPathExists(value, formData.value?.id);
      }, $t('system.menu.message.activePathMustExist'))
      .optional(),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type,
        MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.LINK, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.icon',
    label: $t('system.menu.field.icon'),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type,
        MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.activeIcon',
    label: $t('system.menu.field.activeIcon'),
  },
  {
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      options: componentKeys.map((v) => ({ value: v })),
    },
    dependencies: {
      rules: (values) => {
        return values.type === MenuTypeEnum.MENU ? 'required' : null;
      },
      show: (values) => {
        return values.type === MenuTypeEnum.MENU;
      },
      triggerFields: ['type'],
    },
    fieldName: 'component',
    label: $t('system.menu.field.component'),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.EMBEDDED, MenuTypeEnum.LINK);
      },
      triggerFields: ['type'],
    },
    fieldName: 'linkSrc',
    label: $t('system.menu.field.linkSrc'),
    rules: z.string().url($t('ui.formRules.invalidURL')),
  },
  {
    component: 'Input',
    dependencies: {
      rules: (values) => {
        return values.type === MenuTypeEnum.BUTTON ? 'required' : null;
      },
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type,
        MenuTypeEnum.BUTTON, MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'authCode',
    label: $t('system.menu.field.authCode'),
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      optionType: 'button',
      options: StatusOptions(),
    },
    defaultValue: StatusEnum.ENABLED,
    fieldName: 'status',
    label: $t('system.menu.field.status'),
  },

  {
    component: 'Divider',
    dependencies: {
      show: (values) => {
        return !MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.BUTTON);
      },
      triggerFields: ['type'],
    },
    fieldName: 'divider1',
    formItemClass: 'col-span-2 md:col-span-2 pb-0',
    hideLabel: true,
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.badge'),
      };
    },
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: [
        { label: $t('system.menu.field.badgeType.dot'), value: 'dot' },
        { label: $t('system.menu.field.badgeType.normal'), value: 'normal' },
      ],
    },
    dependencies: {
      show: (values) => {
        return values.type !== MenuTypeEnum.BUTTON;
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badgeType',
    label: $t('system.menu.field.badgeType.title'),
  },
  {
    component: 'Input',
    componentProps: (values) => {
      return {
        allowClear: true,
        class: 'w-full',
        disabled: values.meta?.badgeType !== 'normal',
      };
    },
    dependencies: {
      show: (values) => {
        return values.type !== MenuTypeEnum.BUTTON;
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badge',
    label: $t('system.menu.field.badge'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: MenuService.BadgeVariants.map((v) => ({
        label: v,
        value: v,
      })),
    },
    dependencies: {
      show: (values) => {
        return values.type !== MenuTypeEnum.BUTTON;
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badgeVariants',
    label: $t('system.menu.field.badgeVariants'),
  },
  {
    component: 'Divider',
    dependencies: {
      show: (values) => {
        return !MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.BUTTON);
      },
      triggerFields: ['type'],
    },
    fieldName: 'divider1',
    formItemClass: 'col-span-2 md:col-span-2 pb-0',
    hideLabel: true,
    renderComponentContent() {
      return {
        default: () => $t('system.menu.advancedSettings'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.MENU);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.keepAlive',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.keepAlive'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.MENU, MenuTypeEnum.EMBEDDED);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.affixTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.affixTab'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.BUTTON);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.hideInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.MENU, MenuTypeEnum.CATALOG);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideChildrenInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.hideChildrenInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.BUTTON, MenuTypeEnum.LINK);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInBreadcrumb',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.hideInBreadcrumb'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !MenuTypeUtil.isTypeExist(values.type, MenuTypeEnum.BUTTON, MenuTypeEnum.LINK);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.field.hideInTab'),
      };
    },
  },
];

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});
const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<MenuService.MenuVO>();
      if (data?.type === MenuTypeEnum.LINK) {
        data.linkSrc = data.meta?.link;
      } else if (data?.type === MenuTypeEnum.EMBEDDED) {
        data.linkSrc = data.meta?.iframeSrc;
      }
      if (data) {
        formData.value = data;
        formApi.setValues(formData.value);
        titleSuffix.value = formData.value.title
          ? $t(formData.value.title)
          : '';
      } else {
        formApi.resetForm();
        titleSuffix.value = '';
      }
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    const data =
      await formApi.getValues<Omit<MenuService.MenuVO, 'children' | 'id'>>();
    if (data.type === MenuTypeEnum.LINK) {
      data.meta = { ...data.meta, link: data.linkSrc };
    } else if (data.type === MenuTypeEnum.EMBEDDED) {
      data.meta = { ...data.meta, iframeSrc: data.linkSrc };
    }
    delete data.linkSrc;
    try {
      await (formData.value?.id
        ? updateMenu({id: formData.value.id, ...data})
        : createMenu(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.menu.name')])
    : $t('ui.actionTitle.create', [$t('system.menu.name')]),
);
</script>
<template>
  <Drawer class="w-full max-w-200" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
