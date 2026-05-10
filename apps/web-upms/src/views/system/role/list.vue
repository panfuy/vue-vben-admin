<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RoleService } from '#/api/system/role';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getStatus,
  StatusEnum,
  StatusOptions,
} from '#/api/common/enums/status';
import {
  deleteRole,
  getRoleListPage,
  getRoleRefIdsById,
  saveRoleRef,
  updateRole,
} from '#/api/system/role';
import { $t } from '#/locales';
import SettingsMenu from '#/views/system/menu/modules/settings-menu.vue';
import SettingsPermissions from '#/views/system/permission/modules/settings-permission.vue';

import { onStatusShow } from './common';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: false,
  closeOnPressEscape: true,
});
const [MenuDrawer, menuDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsMenu,
  destroyOnClose: false,
  closeOnPressEscape: true,
});
const [PermissionsDrawer, permissionsDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsPermissions,
  destroyOnClose: false,
  closeOnPressEscape: true,
});

// class: 'w-150',

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
      getRoleRefIdsById('MENU', e.row.id).then((menuIds) => {
        menuDrawerApi.setData({ ...e.row, menuIds }).open();
      });
      break;
    }
    case 'permissions': {
      // 查询此角色拥有的权限ID
      getRoleRefIdsById('PERMISSION', e.row.id).then((permissionIds) => {
        permissionsDrawerApi.setData({ ...e.row, permissionIds }).open();
      });
      break;
    }
    case 'user': {
      // 查询此角色拥有的菜单ID
      getRoleRefIdsById('USER', e.row.id).then((userIds) => {
        // TODO: 打开用户列表页面
      });
      break;
    }
  }
}

/**
 * 保存菜单引用
 * @param roleId 角色ID
 * @param refIds 菜单ID数组
 */
function onSaveRefMenu(roleId: any, refIds: any) {
  saveRoleRef('MENU', roleId, refIds.menuIds);
}

/**
 * 保存权限引用
 * @param roleId  角色ID
 * @param refIds  权限ID数组
 */
function onSaveRefPermission(roleId: any, refIds: any) {
  saveRoleRef('PERMISSION', roleId, refIds.permissionIds);
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

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.field.code'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.field.name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: StatusOptions(),
      },
      fieldName: 'status',
      label: $t('system.role.field.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.role.field.createTime'),
    },
  ];
}

function useColumns(): VxeTableGridColumns {
  return [
    {
      field: 'code',
      title: $t('system.role.field.code'),
      width: 200,
    },
    {
      field: 'name',
      title: $t('system.role.field.name'),
      width: 200,
    },
    {
      field: 'description',
      minWidth: 100,
      title: $t('system.role.field.remark'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange, isShow: onStatusShow },
        name: 'CellSwitch',
      },
      field: 'status',
      title: $t('system.role.field.status'),
      width: 100,
    },
    {
      field: 'sort',
      title: $t('system.role.field.sort'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.role.field.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.field.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'user',
            text: $t('system.common.columns.user'),
          },
          {
            code: 'permissions',
            text: $t('system.common.columns.permissions'),
          },
          {
            code: 'menu',
            text: $t('system.common.columns.menu'),
          },
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.common.columns.operation'),
      width: 280,
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false, // 要点击查询按钮才会触发查询，修改表单项不会自动查询
  },
  gridOptions: {
    columns: useColumns(),
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
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <MenuDrawer @success="onSaveRefMenu" />
    <PermissionsDrawer @success="onSaveRefPermission" />
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
