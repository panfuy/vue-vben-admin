<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { TenantService } from '#/api/system/tenant';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import { StatusEnum, StatusOptions } from '#/api/common/enums/status';
import {
  createTenant,
  isTenantIdExists,
  isTenantNameExists,
  updateTenant,
} from '#/api/system/tenant';
import { $t } from '#/locales';
import { isRecordEdit } from '#/views/system/common';

const emits = defineEmits(['success']);

const formData = ref<TenantService.TenantVO>();

function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('system.tenant.field.id'),
      dependencies: {
        disabled() {
          return !!id.value || false;
        },
        triggerFields: ['id'],
      },
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.tenant.field.id'), 2]))
        .max(32, $t('ui.formRules.maxLength', [$t('system.tenant.field.id'), 32]))
        .regex(
          /^[\w.-]+$/,
          $t('ui.formRules.notMatch', [
            $t('system.tenant.field.id'),
            $t('ui.formRules.onlyLetterNumber'),
          ]),
        )
        .refine(
          async (value: string) => {
            if (!value || value.length === 0 || !!id.value) {
              return true;
            }
            return !(await isTenantIdExists(value));
          },
          (value) => ({
            message: $t('ui.formRules.alreadyExists', [
              $t('system.tenant.field.id'),
              value,
            ]),
          }),
        ),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.tenant.field.name'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.tenant.field.name'), 2]))
        .max(100, $t('ui.formRules.maxLength', [$t('system.tenant.field.name'), 100]))
        .regex(
          /^[\w.-]+$/,
          $t('ui.formRules.notMatch', [
            $t('system.tenant.field.name'),
            $t('ui.formRules.onlyLetterNumber'),
          ]),
        )
        .refine(
          async (value: string) => {
            if (!value || value.length === 0) {
              return true;
            }
            return !(await isTenantNameExists(value));
          },
          (value) => ({
            message: $t('ui.formRules.alreadyExists', [
              $t('system.tenant.field.name'),
              value,
            ]),
          }),
        ),
    },
    {
      component: 'Input',
      fieldName: 'shortName',
      label: $t('system.tenant.field.shortName'),
    },
    {
      component: 'Input',
      fieldName: 'nickName',
      label: $t('system.tenant.field.nickName'),
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
      label: $t('system.tenant.field.status'),
      dependencies: {
        disabled() {
          return !isRecordEdit(formData.value);
        },
        triggerFields: ['status', 'source'],
      },
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 4, // 设置行数，影响高度
      },
      fieldName: 'remark',
      label: $t('system.tenant.field.remark'),
    },
  ];
}

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    (id.value ? updateTenant(values) : createTenant(values))
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
      const data = drawerApi.getData<TenantService.TenantVO>();
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
    ? $t('common.edit', $t('system.tenant.name'))
    : $t('common.create', $t('system.tenant.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
