<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickFn,
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { MenuService } from '#/api/system/menu';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';
import { $t } from '@vben/locales';

import { MenuBadge } from '@vben-core/menu-ui';

import { Button, message } from 'ant-design-vue';

import { ModalAsync } from '#/adapter/modal';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getStatus,
  StatusEnum,
  StatusOptions,
} from '#/api/common/enums/status';
import { deleteMenu, getMenuList, updateMenu } from '#/api/system/menu';
import { isRecordEdit } from '#/views/system/common';

import { getMenuTypeOptions } from './common';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true, // 关闭时销毁
});

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.menu.field.name'),
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('system.menu.field.title'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: StatusOptions(),
      },
      fieldName: 'status',
      label: $t('system.common.field.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.common.field.createTime'),
    },
  ];
}

function useColumns(
  onActionClick: OnActionClickFn<MenuService.MenuVO>,
): VxeTableGridColumns<MenuService.MenuVO> {
  return [
    {
      align: 'left',
      field: 'title',
      fixed: 'left',
      slots: { default: 'title' },
      title: $t('system.menu.field.title'),
      treeNode: true,
      width: 250,
    },
    {
      align: 'left',
      fixed: 'left',
      field: 'name',
      title: $t('system.menu.field.name'),
      width: 150,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'type',
      title: $t('system.menu.field.type'),
      width: 100,
    },
    {
      field: 'authCode',
      title: $t('system.menu.field.authCode'),
      width: 200,
    },
    {
      align: 'left',
      field: 'path',
      title: $t('system.menu.field.path'),
      width: 200,
    },

    {
      align: 'left',
      field: 'component',
      formatter: ({ row }) => {
        switch (row.type) {
          case 'CATALOG':
          case 'MENU': {
            return row.component ?? '';
          }
          case 'EMBEDDED': {
            return row.meta?.iframeSrc ?? '';
          }
          case 'LINK': {
            return row.meta?.link ?? '';
          }
        }
        return '';
      },
      minWidth: 200,
      title: $t('system.menu.field.component'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
      },
      field: 'status',
      title: $t('system.common.field.status'),
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 100,
      title: $t('system.common.field.remark'),
    },
    {
      field: 'updateBy',
      title: $t('system.common.field.updateBy'),
      width: 140,
    },
    {
      field: 'updateTime',
      title: $t('system.common.field.updateTime'),
      width: 140,
    },
    {
      align: 'right',
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
          },
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.common.columns.operation'),
      width: 'auto',
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
          return await getMenuList({
            current: page.currentPage,
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
    },
  } as VxeTableGridOptions,
});

function onActionClick({ code, row }: OnActionClickParams<MenuService.MenuVO>) {
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
function onEdit(row: MenuService.MenuVO) {
  formDrawerApi.setData(row).open();
}
function onCreate() {
  formDrawerApi.setData({}).open();
}
function onAppend(row: MenuService.MenuVO) {
  formDrawerApi.setData({ parentId: row.id }).open();
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(newStatus: StatusEnum, row: MenuService.MenuVO) {
  // 只有source字段为空字符串的角色才可以操作状态
  if (!isRecordEdit(row)) {
    message.warning(`${$t('system.common.message.statusNoModify')}`);
    return false;
  }

  try {
    await ModalAsync.confirm(
      `${$t('system.common.message.statusSwitchTips', [row.name, getStatus(newStatus)?.label])}`,
      `${$t('system.common.message.statusSwitch')}`,
    );
    await updateMenu({ id: row.id, status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onDelete(row: MenuService.MenuVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteMenu(row.id)
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
          {{ $t('ui.actionTitle.create', [$t('system.menu.name')]) }}
        </Button>
      </template>
      <template #title="{ row }">
        <div class="flex w-full items-center gap-1">
          <div class="size-5 shrink-0">
            <IconifyIcon
              v-if="row.type === 'BUTTON'"
              icon="carbon:security"
              class="size-full"
            />
            <IconifyIcon
              v-else-if="row.meta?.icon"
              :icon="row.meta?.icon || 'carbon:circle-dash'"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ $t(row.title) }}</span>
          <div class="items-center justify-end"></div>
        </div>
        <MenuBadge
          v-if="row.meta?.badgeType"
          class="menu-badge"
          :badge="row.meta.badge"
          :badge-type="row.meta.badgeType"
          :badge-variants="row.meta.badgeVariants"
        />
      </template>
    </Grid>
  </Page>
</template>
<style lang="scss" scoped>
.menu-badge {
  top: 50%;
  right: 0;
  transform: translateY(-50%);

  & > :deep(div) {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
