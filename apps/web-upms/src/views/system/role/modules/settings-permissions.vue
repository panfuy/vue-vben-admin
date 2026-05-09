<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { RoleService } from '#/api/system/role';

import { nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';

import { Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getPermissionTreeList } from '#/api/system/permission';
import { saveRoleRef } from '#/api/system/role';
import { $t } from '#/locales';


const emits = defineEmits(['success']);

const formData = ref<RoleService.RoleVO>();

const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'permissionIds',
      formItemClass: 'items-start',
      hideLabel: true,
      modelPropName: 'modelValue',
    },
  ],
  showDefaultActions: false,
});

const permissionTreeData = ref<DataNode[]>([]);
const loadingPermissions = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const values = await formApi.getValues();
    drawerApi.lock();
    saveRoleRef('PERMISSION', id.value, values.permissionIds)
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

      if (permissionTreeData.value.length === 0) {
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
  loadingPermissions.value = true;
  try {
    const res = await getPermissionTreeList();
    permissionTreeData.value = res as unknown as DataNode[];
  } finally {
    loadingPermissions.value = false;
  }
}

</script>
<template>
  <Drawer :title="$t('system.common.setPermission')">
    <Form>
      <template #permissionIds="slotProps">
        <Spin :spinning="loadingPermissions" wrapper-class-name="w-full">
          <Tree
            class="permissions-tree"
            :style="{ '--select-all-text': `'${$t('common.selectAll')}'` }"
            :tree-data="permissionTreeData"
            multiple
            bordered
            v-bind="slotProps"
            value-field="id"
            label-field="code"
          >
            <template #node="{ value }">
              <span class="permission-tree-node-text">
                {{ value.description ? `${value.description} (${value.code})` : value.code }}
              </span>
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

:deep(.permissions-tree .size-5)::after {
  margin-left: 0.5rem;
  color: inherit;
  content: var(--select-all-text, 'Select All');
}

:deep(.permissions-tree .permission-tree-node-text) {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
