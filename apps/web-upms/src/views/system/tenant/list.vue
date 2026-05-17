<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TenantService } from '#/api/system/tenant';

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
import { VO } from '#/api/common/vo/base';
import {
  deleteTenant,
  getTenantListPage,
  getTenantRefIdsById,
  saveTenantRefMenu,
  saveTenantRefUserRole,
  updateTenant,
} from '#/api/system/tenant';
import { $t } from '#/locales';
import { isRecordEdit, Item } from '#/views/system/common';
import SettingsMenu from '#/views/system/menu/modules/settings-menu.vue';
import SettingsUserRole from '#/views/system/user/modules/settings-user-role.vue';

import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true, // 关闭时销毁
});
const [MenuDrawer, menuDrawerApi] = useVbenDrawer({
  connectedComponent: SettingsMenu,
  destroyOnClose: true, // 关闭时销毁
});

const [UserRoleModal, userRoleModalApi] = useVbenModal({
  connectedComponent: SettingsUserRole,
  destroyOnClose: true, // 关闭时销毁
});

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('system.tenant.field.id'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.tenant.field.name'),
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
      align: 'left',
      field: 'id',
      title: $t('system.tenant.field.id'),
      width: 250,
    },
    {
      align: 'left',
      field: 'name',
      title: $t('system.tenant.field.name'),
      width: 150,
    },
    {
      align: 'left',
      field: 'shortName',
      title: $t('system.tenant.field.shortName'),
      width: 200,
    },
    {
      align: 'left',
      field: 'nickName',
      title: $t('system.tenant.field.nickName'),
      width: 200,
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
      align: 'left',
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
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.tenant.field.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'user',
            text: $t('system.common.columns.user'),
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
      minWidth: 400,
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
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: any) => {
          return await getTenantListPage({
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
  } as VxeTableGridOptions<TenantService.TenantVO>,
});

function onActionClick(e: OnActionClickParams<TenantService.TenantVO>) {
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
      getTenantRefIdsById('MENU', e.row.id).then((menuIds) => {
        menuDrawerApi.setData({ ...e.row, menuIds, switchTenantId: e.row.id }).open();
      });
      break;
    }
    case 'user': {
      // 查询此角色拥有的管理员ID
      getTenantRefIdsById('USER', e.row.id).then((userIds) => {
        userRoleModalApi.setData({ ...e.row, userIds, switchTenantId: e.row.id }).open();
      });
      break;
    }
  }
}

/**
 * 保存菜单引用
 * @param tenantId 租户ID
 * @param data 菜单ID数组
 */
function onSaveRefMenu(tenantId: any, data: any) {
  saveTenantRefMenu(tenantId, data.menuIds);
}

function onSaveRefUserRole(tenantId: any, data: any) {
  const { creates, updates, deletes } = data.batchVO;
  const params: VO.BatchVO<TenantService.TenantRefUserRoleVO> = {
    creates: convertRefVO(creates),
    updates: convertRefVO(updates),
    deletes: convertRefVO(deletes),
  };
  // 处理更新
  saveTenantRefUserRole(tenantId, params);
}

function convertRefVO(
  list: Array<Item.User>,
): Array<TenantService.TenantRefUserRoleVO> {
  // 封装返回对象封装成[{userVO, roleVO}]格式
  const params: Array<TenantService.TenantRefUserRoleVO> = [];
  (list || []).forEach((user: Item.User) => {
    if (!user.roles || user.roles.length === 0) {
      // 没有角色时，添加user对象
      params.push({ userVO: { id: user.id } });
      return;
    }
    // 有角色时，添加user对象和role对象
    user.roles.forEach((role: Item.Role) => {
      params.push({ userVO: { id: user.id }, roleVO: { id: role.id } });
    });
  });
  return params;
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(
  newStatus: StatusEnum,
  row: TenantService.TenantVO,
) {
  // 只有source字段为空字符串的租户才可以操作状态
  if (!isRecordEdit(row)) {
    message.warning(`${$t('system.common.message.statusNoModify')}`);
    return false;
  }

  try {
    await ModalAsync.confirm(
      `${$t('system.common.message.statusSwitchTips', [row.name, getStatus(newStatus)?.label])}`,
      `${$t('system.common.message.statusSwitch')}`,
    );
    await updateTenant({ id: row.id, status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onDelete(row: TenantService.TenantVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteTenant(row.id)
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
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <MenuDrawer @success="onSaveRefMenu" />
    <UserRoleModal @success="onSaveRefUserRole" />
    <Grid :table-title="$t('system.tenant.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.tenant.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
