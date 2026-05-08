<script lang="ts" setup>

import type { VbenFormSchema } from '#/adapter/form';
import type { PermissionService } from '#/api/system/permission';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import {
  createPermission,
  getPermissionAllRootList,
  isPermissionCodeExists,
  updatePermission,
} from '#/api/system/permission';
import { $t } from '#/locales';

import { getPermissionTypeOptions, TypeEnum } from '../common';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<PermissionService.PermissionVO>();
const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getPermissionTypeOptions(),
      optionType: 'button',
    },
    defaultValue: TypeEnum.UNKNOWN,
    rules: 'selectRequired',
    fieldName: 'type',
    label: $t('system.permission.field.type'),
    dependencies: {
      disabled() {
        return !!formData.value?.id;
      },
      triggerFields: ['type'],
    },
  },
  {
    component: 'ApiSelect',
    componentProps: {
      api: getPermissionAllRootList,
      afterFetch: (data: { code: string; description: string }[]) => {
        return data.map((item: any) => ({
          label: item.description?`${item.description} (${item.code})`: item.code,
          value: item.id,
        }));
      },
      class: 'w-full',
      labelField: 'label',
      valueField: 'value',
    },
    dependencies: {
      show(values: Partial<PermissionService.PermissionVO>) {
        return values.type === TypeEnum.OPERATION;
      },
      disabled() {
        return !!formData.value?.id;
      },
      triggerFields: ['type'],
    },
    rules: 'selectRequired',
    fieldName: 'parentId',
    label: $t('system.permission.field.parent'),
  },
  {
    component: 'Input',
    fieldName: 'code',
    label: $t('system.permission.field.code'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.permission.field.code'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.permission.field.code'), 100]))
      .regex(
        /^[\w.-]+$/,
        $t('common.formRules.notMatch', [
          $t('system.permission.field.code'),
          $t('common.formRules.onlyLetterNumber'),
        ]),
      )
      .refine(
        async (value: string) => {
          if (!value || value.length === 0) {
            return true;
          }
          return !(await isPermissionCodeExists(value, formData.value?.type, formData.value?.id));
        },
        (value) => ({
          message: $t('ui.formRules.alreadyExists', [
            $t('system.permission.field.code'),
            value,
          ]),
        }),
      ),
  },
  {
    component: 'Textarea',
    componentProps: {
      rows: 4, // 设置行数，影响高度
    },
    fieldName: 'description',
    label: $t('system.permission.field.description'),
  },
];

const [Form, formApi] = useVbenForm({
  schema,
  showDefaultActions: false,
});
const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<PermissionService.PermissionVO>();
      if (data) {
        formData.value = data;
        formApi.setValues(formData.value);
      } else {
        formApi.resetForm();
        formData.value = undefined;
      }
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    const data =
      await formApi.getValues<Omit<PermissionService.PermissionVO, 'children' | 'id'>>();
    try {
      await (formData.value?.id
        ? updatePermission({id: formData.value.id, ...data})
        : createPermission(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.permission.name')])
    : $t('ui.actionTitle.create', [$t('system.permission.name')]),
);
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
