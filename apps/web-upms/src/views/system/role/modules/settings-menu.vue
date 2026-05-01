<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type { RoleService } from '#/api/system/role';

import { nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getMenuTreeList } from '#/api/system/menu';
import { saveRoleRef } from '#/api/system/role';
import { $t } from '#/locales';

const emits = defineEmits(['success']);

const formData = ref<RoleService.RoleVO>();

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

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const values = await formApi.getValues();
    drawerApi.lock();
    saveRoleRef('MENU', id.value, values.menuIds)
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
  if (node.value?.type === 'button') {
    classes.push('inline-flex');
  }

  return classes.join(' ');
}
</script>
<template>
  <Drawer :title="$t('system.common.setMenu')">
    <Form>
      <template #menuIds="slotProps">
        <Spin :spinning="menuLoadingShow" wrapper-class-name="w-full">
          <Tree
            class="menus-tree"
            :style="{ '--select-all-text': `'${$t('common.selectAll')}'` }"
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

:deep(.menus-tree .size-5)::after {
  margin-left: 0.5rem;
  color: inherit;
  content: var(--select-all-text, 'Select All');
}
</style>
