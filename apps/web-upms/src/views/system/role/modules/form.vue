<script lang="ts" setup>
import type { RoleService } from '#/api/system/role';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import { StatusEnum, StatusOptions } from '#/api/common/enums/status';
import { createRole, isRoleCodeExists, updateRole } from '#/api/system/role';
import { $t } from '#/locales';
import { isRecordEdit } from '#/views/system/common';

const emits = defineEmits(['success']);

const formData = ref<RoleService.RoleVO>();

const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.field.code'),
      dependencies: {
        disabled() {
          return !!id.value || false;
        },
        triggerFields: ['code'],
      },
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.role.field.code'), 2]))
        .max(
          30,
          $t('ui.formRules.maxLength', [$t('system.role.field.code'), 30]),
        )
        .regex(
          /^[\w.-]+$/,
          $t('ui.formRules.notMatch', [
            $t('system.role.field.code'),
            $t('ui.formRules.onlyLetterNumber'),
          ]),
        )
        .refine(
          async (value: string) => {
            if (!value || value.length === 0 || !!id.value) {
              return true;
            }
            return !(await isRoleCodeExists(value));
          },
          (value) => ({
            message: $t('ui.formRules.alreadyExists', [
              $t('system.role.field.code'),
              value,
            ]),
          }),
        ),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.field.name'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: StatusOptions(),
        optionType: 'button',
      },
      defaultValue: StatusEnum.ENABLED,
      fieldName: 'status',
      label: $t('system.common.field.status'),
      dependencies: {
        disabled() {
          return !isRecordEdit(formData.value);
        },
        triggerFields: ['status', 'code'],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('system.role.field.sort'),
      rules: 'required',
      defaultValue: 0,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 4, // 设置行数，影响高度
      },
      fieldName: 'description',
      label: $t('system.common.field.remark'),
    },
  ],
  showDefaultActions: false,
});

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    (id.value ? updateRole({ id: id.value, ...values }) : createRole(values))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<RoleService.RoleVO>();
      formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
