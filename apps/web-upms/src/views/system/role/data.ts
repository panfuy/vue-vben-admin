import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { RoleService } from '#/api';

import { StatusEnum, StatusOptions } from '#/api/common/enums/status';
import { $t } from '#/locales';

/**
 * 状态列显示控制（是否显示状态开关）
 * @param row 数据行
 */
export function onStatusShow(row: RoleService.RoleVO) {
  if (row.source && row.source !== '') {
    return false; // 不可以修改
  }
  return true; // 可修改
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'None',
      fieldName: 'id',
      hide: true,
    },
    {
      component: 'None',
      fieldName: 'source',
      hide: true,
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.code'),
      dependencies: {
        disabled(values) {
          return !!values?.id || false;
        },
        triggerFields: ['id', 'code'],
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: StatusOptions(),
        optionType: 'button',
      },
      defaultValue: StatusEnum.ENABLED,
      fieldName: 'status',
      label: $t('system.role.status'),
      dependencies: {
        disabled(values) {
          return !onStatusShow(values as RoleService.RoleVO);
        },
        triggerFields: ['status', 'source'],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('system.role.sort'),
      rules: 'required',
      defaultValue: 0,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 4, // 设置行数，影响高度
      },
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
  ];
}

export function useMenuSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'menuIds',
      formItemClass: 'items-start',
      hideLabel: true,
      modelPropName: 'modelValue',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.code'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: StatusOptions(),
      },
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.role.createTime'),
    },
  ];
}

export function useColumns<T = RoleService.RoleVO>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
  onStatusShow?: (row: T) => boolean,
): VxeTableGridColumns {
  return [
    {
      field: 'code',
      title: $t('system.role.code'),
      width: 200,
    },
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 200,
    },
    {
      field: 'description',
      minWidth: 100,
      title: $t('system.role.remark'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange, isShow: onStatusShow },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'sort',
      title: $t('system.role.sort'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'menu',
            text: $t('system.role.menu'),
          },
          {
            code: 'permissions',
            text: $t('system.role.permissions'),
          },
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      maxWidth: 200,
    },
  ];
}
