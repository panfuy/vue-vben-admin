import { ref } from 'vue';

import { defineStore } from 'pinia';

import { getTenantList } from '#/api/system/tenant';

export interface Tenant {
  id: string;
  name: string;
}

export const useTenantStore = defineStore('tenant', () => {
  // 当前租户ID
  const currentTenantId = ref<string>('');

  // 租户列表
  const tenantList = ref<Tenant[]>([]);

  /**
   * 初始化租户
   * 应用启动时调用，从后端获取租户列表
   */
  async function initTenant() {
    try {
        tenantList.value = await getTenantList();

        // 设置当前租户为第一个
        if (tenantList.value.length > 0) {
          currentTenantId.value = tenantList.value[0].id;
        }
    } catch (error) {
      console.error('获取租户列表失败:', error);
    }
  }

  /**
   * 切换租户
   */
  function setCurrentTenant(tenantId: string) {
    currentTenantId.value = tenantId;
  }

  /**
   * 获取当前租户信息
   */
  function getCurrentTenant(): Tenant | undefined {
    return tenantList.value.find((t) => t.id === currentTenantId.value);
  }

  return {
    currentTenantId,
    getCurrentTenant,
    initTenant,
    setCurrentTenant,
    tenantList,
  };
});
