<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import { nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getMenuTreeList } from '#/api/system/menu';
import { $t } from '#/locales';

import { MenuTypeEnum } from '../common';

const emits = defineEmits(['success']);

const formData = ref<any>();

const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'menuIds',
      formItemClass: 'items-start',
      hideLabel: true,
      modelPropName: 'modelValue',
    },
  ],
  showDefaultActions: false,
});

const menuTreeData = ref<DataNode[]>([]);
const menuLoadingShow = ref(false);

const handerId = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const values = await formApi.getValues();
    drawerApi.lock();
    emits('success', handerId.value,  values);
    drawerApi.close();
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<any>();
      formApi.resetForm();

      if (data) {
        formData.value = data;
        handerId.value = data.id;
      } else {
        handerId.value = undefined;
      }

      if (menuTreeData.value.length === 0) {
        await loadData();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

async function loadData() {
  menuLoadingShow.value = true;
  try {
    const res = await getMenuTreeList();
    menuTreeData.value = res as unknown as DataNode[];
  } finally {
    menuLoadingShow.value = false;
  }
}

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === MenuTypeEnum.BUTTON) {
    classes.push('inline-flex');
  }
  return classes.join(' ');
}
</script>

<template>
  <Drawer :title="$t('system.menu.settings.setMenu')">
    <Form>
      <template #menuIds="slotProps">
        <Spin :spinning="menuLoadingShow" wrapper-class-name="w-full">
          <Tree
            class="menus-tree"
            :tree-data="menuTreeData"
            multiple
            bordered
            :transition="false"
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            v-bind="slotProps"
            value-field="id"
            label-field="title"
            icon-field="meta.icon"
            :select-all-label="$t('common.selectAll')"
          >
            <template #node="{ value }">
              <IconifyIcon v-if="value.meta.icon" :icon="value.meta.icon" />
              {{ $t(value.title) }}
            </template>
          </Tree>
        </Spin>
      </template>
    </Form>
  </Drawer>
</template>

<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    @apply ml-5 hidden;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    @apply ml-5 flex flex-auto justify-end;
  }
}

</style>
