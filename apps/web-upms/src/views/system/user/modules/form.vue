<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { UserService } from '#/api/system/user';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import { StatusEnum, StatusOptions } from '#/api/common/enums/status';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';
import { isRecordEdit } from '#/views/system/common';

import { GenderEnum, GenderOptions } from '../user-gender';

const emits = defineEmits(['success']);

const formData = ref<UserService.UserVO>();

function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.user.field.name'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.user.field.name'), 2]))
        .max(
          100,
          $t('ui.formRules.maxLength', [$t('system.user.field.name'), 100]),
        ),
    },
    {
      component: 'Input',
      fieldName: 'firstName',
      label: $t('system.user.field.firstName'),
      rules: z
        .string()
        .min(
          1,
          $t('ui.formRules.minLength', [$t('system.user.field.firstName'), 1]),
        )
        .max(
          100,
          $t('ui.formRules.maxLength', [
            $t('system.user.field.firstName'),
            100,
          ]),
        )
        .optional(),
    },
    {
      component: 'Input',
      fieldName: 'lastName',
      label: $t('system.user.field.lastName'),
      rules: z
        .string()
        .min(
          1,
          $t('ui.formRules.minLength', [$t('system.user.field.lastName'), 1]),
        )
        .max(
          100,
          $t('ui.formRules.maxLength', [$t('system.user.field.lastName'), 100]),
        )
        .optional(),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: GenderOptions(),
        optionType: 'button',
      },
      defaultValue: GenderEnum.UNKNOWN,
      fieldName: 'gender',
      label: $t('system.user.field.gender'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.field.email'),
      rules: z.string().email($t('ui.formRules.email')).optional(),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.field.phone'),
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
      label: $t('system.user.field.status'),
      rules: 'required',
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
      label: $t('system.user.field.remark'),
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
    (id.value ? updateUser(values) : createUser(values))
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
      const data = drawerApi.getData<UserService.UserVO>();
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
    ? $t('common.edit', $t('system.user.name'))
    : $t('common.create', $t('system.user.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
