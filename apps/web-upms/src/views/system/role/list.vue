<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RoleService } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRole,
  getRefIdsById,
  getRoleListPage,
  updateRole,
} from '#/api';
import { getStatus, StatusEnum } from '#/api/common/enums/status';
import { $t } from '#/locales';

import { onStatusShow, useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import SettingsMenu from './modules/settings-menu.vue';
import SettingsPermissions from './modules/settings-permissions.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: false,
});
const [MenuDrawer, menuDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsMenu,
  destroyOnClose: false,
});
const [PermissionsDrawer, permissionsDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsPermissions,
  destroyOnClose: false,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange, onStatusShow),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: any) => {
          return await getRoleListPage({
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<RoleService.RoleVO>,
});

function onActionClick(e: OnActionClickParams<RoleService.RoleVO>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      formDrawerApi.setData(e.row).open();
      break;
    }
    case 'menu': {
      // 查询此角色拥有的菜单ID
      getRefIdsById('MENU', e.row.id).then((menuIds) => {
        menuDrawerApi.setData({ ...e.row, menuIds }).open();
      });
      break;
    }
    case 'permissions': {
      // 查询此角色拥有的权限ID
      getRefIdsById('PERMISSION', e.row.id).then((permissionIds) => {
        permissionsDrawerApi.setData({ ...e.row, permissionIds }).open();
      });
      break;
    }
  }
}

/**
 * 将Antd的Modal.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
function confirm(content: string, title: string) {
  return new Promise((reslove, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        reslove(true);
      },
      title,
    });
  });
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(newStatus: StatusEnum, row: RoleService.RoleVO) {
  // 只有source字段为空字符串的角色才可以操作状态
  if (!onStatusShow(row)) {
    message.warning('该角色状态不可修改');
    return false;
  }

  try {
    await confirm(
      `你要将${row.name}的状态切换为 【${getStatus(newStatus)?.label}】 吗？`,
      `切换状态`,
    );
    await updateRole({ id: row.id, status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onDelete(row: RoleService.RoleVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteRole(row.id)
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

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  // 获取表格分页数据中total字段
  const proxyInfo = gridApi.grid?.getProxyInfo();
  const totalRows = proxyInfo?.pager?.total ?? 0;
  formDrawerApi.setData({ sort: totalRows + 1 }).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <MenuDrawer @success="onRefresh" />
    <PermissionsDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
