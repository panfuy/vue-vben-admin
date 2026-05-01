import type { TenantService } from '#/api/system/tenant';


/**
 * 状态列显示控制（是否显示状态开关）
 * @param row 数据行
 */
export function onStatusShow(row: TenantService.TenantVO) {
  if (row.source && row.source !== '') {
    return false; // 不可以修改
  }
  return true; // 可修改
}
