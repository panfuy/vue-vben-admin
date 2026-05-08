<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickFn,
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions
} from '#/adapter/vxe-table';
import type { PermissionService } from '#/api/system/permission';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePermission, getPermissionList } from '#/api/system/permission';

import { getPermissionTypeOptions } from './common';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true, // 关闭时销毁
  closeOnPressEscape: true, // Esc按钮为关闭事件
});

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.permission.field.code'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getPermissionTypeOptions(),
      },
      fieldName: 'type',
      label: $t('system.permission.field.type'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.permission.field.createTime'),
    },
  ];
}

function useColumns(
  onActionClick: OnActionClickFn<PermissionService.PermissionVO>,
): VxeTableGridColumns<PermissionService.PermissionVO> {
  return [
    {
      align: 'left',
      field: 'code',
      slots: { default: 'title' },
      title: $t('system.permission.field.code'),
      treeNode: true,
      width: 450,
    },
    {
      align: 'left',
      field: 'description',
      title: $t('system.permission.field.description'),
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getPermissionTypeOptions() },
      field: 'type',
      title: $t('system.permission.field.type'),
      width: 100,
    },
    {
      align: 'right',
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.common.columns.operation'),
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: $t('system.common.columns.createSub'),
            show: (row: PermissionService.PermissionVO) => row.parentId === null
          },
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: any) => {
          return await getPermissionList({
            currPage: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: false,
      // expandAll: true,
    },
  } as VxeTableGridOptions,
});

function onActionClick({ code, row }: OnActionClickParams<PermissionService.PermissionVO>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    default: {
      break;
    }
  }
}

function onRefresh() {
  gridApi.query();
}
function onEdit(row: PermissionService.PermissionVO) {
  formDrawerApi.setData(row).open();
}
function onCreate() {
  formDrawerApi.setData({}).open();
}
function onAppend(row: PermissionService.PermissionVO) {
  formDrawerApi.setData({ parentId: row.id }).open();
}

function onDelete(row: PermissionService.PermissionVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deletePermission(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.permission.name')]) }}
        </Button>
      </template>
      <template #title="{ row }">
        <div class="flex w-full items-center gap-1">
          <span class="flex-auto">{{ row.code }}</span>
          <div class="items-center justify-end"></div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
<style lang="scss" scoped>
</style>
