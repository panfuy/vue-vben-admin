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
}
