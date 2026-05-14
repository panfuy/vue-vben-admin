<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RoleService } from '#/api/system/role';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { ModalAsync } from '#/adapter/modal';
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
import { isRecordEdit } from '#/views/system/common';
import SettingsMenu from '#/views/system/menu/modules/settings-menu.vue';
import SettingsPermissions from '#/views/system/permission/modules/settings-permission.vue';
import SettingsUser from '#/views/system/user/modules/settings-user.vue';

import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: false, // 关闭时销毁
});

const [UserModal, userModalApi] = useVbenModal({
  connectedComponent: SettingsUser,
  destroyOnClose: true, // 关闭时销毁
});

const [MenuDrawer, menuDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsMenu,
  destroyOnClose: false, // 关闭时销毁
});
const [PermissionsDrawer, permissionsDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsPermissions,
  destroyOnClose: false, // 关闭时销毁
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
        userModalApi.setData({ ...e.row, userIds }).open();
      });
      break;
    }
  }
}

/**
 * 保存用户引用
 * @param roleId  角色ID
 * @param data  处理后的数据
 */
function onSaveRefUser(roleId: string, data: any) {
  saveRoleRef('USER', roleId, data.userIds);
}

/**
 * 保存菜单引用
 * @param roleId 角色ID
 * @param data 处理后的数据
 */
function onSaveRefMenu(roleId: string, data: any) {
  saveRoleRef('MENU', roleId, data.menuIds);
}

/**
 * 保存权限引用
 * @param roleId  角色ID
 * @param data  处理后的数据
 */
function onSaveRefPermission(roleId: string, data: any) {
  saveRoleRef('PERMISSION', roleId, data.permissionIds);
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(newStatus: StatusEnum, row: RoleService.RoleVO) {
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
      label: $t('system.common.field.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.common.field.createTime'),
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
      title: $t('system.common.field.remark'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange, isShow: isRecordEdit },
        name: 'CellSwitch',
      },
      field: 'status',
      title: $t('system.common.field.status'),
      width: 100,
    },
    {
      field: 'sort',
      title: $t('system.role.field.sort'),
      width: 50,
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
      width: 'auto',
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<RoleService.RoleVO>,
});
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <UserModal @success="onSaveRefUser" />
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
