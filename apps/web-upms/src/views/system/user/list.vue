<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridColumns,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { UserService } from '#/api/system/user';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getStatus, StatusEnum,StatusOptions } from '#/api/common/enums/status';
import { deleteUser, getUserListPage, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { onStatusShow } from './common';
import Form from './modules/form.vue';
import { GenderOptions } from './user-gender';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.user.field.name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: GenderOptions(),
      },
      fieldName: 'gender',
      label: $t('system.user.field.gender'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: StatusOptions(),
      },
      fieldName: 'status',
      label: $t('system.user.field.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.user.field.createTime'),
    },
  ];
}

function useColumns(): VxeTableGridColumns {
  return [
    {
      align: 'left',
      field: 'name',
      title: $t('system.user.field.name'),
      width: 200,
    },
    {
      align: 'left',
      field: 'firstName',
      title: $t('system.user.field.firstName'),
      width: 150,
    },
    {
      align: 'left',
      field: 'lastName',
      title: $t('system.user.field.lastName'),
      width: 150,
    },
    {
      field: 'gender',
      cellRender: { name: 'CellTag', options: GenderOptions() },
      // formatter: ({ cellValue }) => getGender(cellValue).label,
      title: $t('system.user.field.gender'),
      width: 100,
    },
    {
      align: 'left',
      field: 'email',
      title: $t('system.user.field.email'),
      width: 200,
    },
    {
      align: 'left',
      field: 'phone',
      title: $t('system.user.field.phone'),
      width: 200,
    },
    {
      align: 'left',
      field: 'description',
      minWidth: 100,
      title: $t('system.user.field.remark'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange, isShow: onStatusShow },
        name: 'CellSwitch',
      },
      field: 'status',
      title: $t('system.user.field.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.user.field.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.user.field.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.common.columns.operation'),
      width: 200,
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
          return await getUserListPage({
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
  } as VxeTableGridOptions<UserService.UserVO>,
});

function onActionClick(e: OnActionClickParams<UserService.UserVO>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      formDrawerApi.setData(e.row).open();
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
async function onStatusChange(newStatus: StatusEnum, row: UserService.UserVO) {
  // 只有source字段为空字符串的租户才可以操作状态
  if (!onStatusShow(row)) {
    message.warning('该租户状态不可修改');
    return false;
  }

  try {
    await confirm(
      `你要将${row.name}的状态切换为 【${getStatus(newStatus)?.label}】 吗？`,
      `切换状态`,
    );
    await updateUser({ id: row.id, status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onDelete(row: UserService.UserVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteUser(row.id)
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
    <MenuDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.user.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
