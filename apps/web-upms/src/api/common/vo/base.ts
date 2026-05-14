import type { Recordable } from '@vben/types';
export namespace VO {
  /**
   * 分页对象
   */
  export interface PageVO<T = any> {
    [key: string]: any;
    current: number;
    pageSize: number;
    total?: number;
    size?: number;
    records?: T[];
  }

  /**
   * 请求头的key值
   */
  export const tenantHeaderKey = 'x-tenant-id';

  /**
   * 封装租户ID
   * @param tenantId 租户ID
   * @returns
   */
  export function createTenantHeader(
    tenantId?: string,
  ): Recordable<number | string> {
    const _tenantId = tenantId?.trim();
    return _tenantId ? { [tenantHeaderKey]: _tenantId } : {};
  }
}
