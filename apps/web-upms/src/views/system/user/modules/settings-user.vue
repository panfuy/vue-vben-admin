<script lang="ts" setup>
import type { VO } from '#/api/common/vo/base';
import type { UserService } from '#/api/system/user';
import type {Item} from '#/views/system/common';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, List, Pagination, Spin } from 'ant-design-vue';

import { StatusEnum } from '#/api/common/enums/status';
import { getUserListByIds, getUserListPage } from '#/api/system/user';
import { convertUserItem } from '#/views/system/common';


// 响应的事件
const emits = defineEmits(['success']);
// 传入的待处理ID
const handerId = ref<string>('');
// 右侧已选择的用户
const selectedData = ref<Item.User[]>([]);
const loading = ref(false);
// 左侧待选择的用户
const leftSearchText = ref('');
const leftDataSource = ref<Item.User[]>([]);
const leftPagination = ref<VO.PageVO>({ current: 1, pageSize: 10, total: 0 });

const [Modal, modalApi] = useVbenModal({
  class: 'w-[700px] max-w-[90vw]',
  async onConfirm() {
    const values = selectedData.value.map((u) => u.id);
    modalApi.lock();
    emits('success', handerId.value, { userIds: values });
    modalApi.close();
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ id: string; userIds: string[] }>();
      if (data) {
        handerId.value = data.id;
        await loadSelectedData(data.userIds || []);
      } else {
        handerId.value = '';
        selectedData.value = [];
      }
      await loadLeftData();
    }
  },
});

async function loadSelectedData(selectedIds: string[]) {
  if (selectedIds.length === 0) {
    selectedData.value = [];
    return;
  }
  // 根据已选择的用户ID加载详细信息
  const res = (await getUserListByIds(selectedIds)) as UserService.UserVO[];
  selectedData.value = convertUserItem(res || []);
}

async function loadLeftData() {
  loading.value = true;
  try {
    const res = (await getUserListPage({
      condition: leftSearchText.value || undefined,
      status: StatusEnum.ENABLED,
      current: leftPagination.value.current,
      pageSize: leftPagination.value.pageSize,
    } as any)) as VO.PageVO<UserService.UserVO>;
    leftDataSource.value = convertUserItem(res?.records || []);
    leftPagination.value.total = res?.total || 0;
  } finally {
    loading.value = false;
  }
}


// 左侧搜索防抖定时器
let leftSearchTimer: null | ReturnType<typeof setTimeout> = null;
watch(leftSearchText, () => {
  if (leftSearchTimer) {
    clearTimeout(leftSearchTimer);
  }
  leftSearchTimer = setTimeout(() => {
    leftPagination.value.current = 1;
    loadLeftData();
  }, 300);
});

function handleLeftPageChange(page: number) {
  leftPagination.value.current = page;
  loadLeftData();
}

function handleSelect(id: string) {
  if (!isSelected(id)) {
    const item = leftDataSource.value.find((u) => u.id === id);
    if (item) {
      selectedData.value = [...selectedData.value, item];
    }
  }
}

function handleRemove(id: string) {
  // 筛选出所有不满足条件的元素，生成新数组
  selectedData.value = selectedData.value.filter((u) => u.id !== id);
}

// 判断数组中是否存在符合条件的元素
const isSelected = (id: string) => {
  if (!id || selectedData.value.length === 0) {
    return false;
  }
  return selectedData.value.some((u) => u.id === id);
};
</script>
<template>
  <Modal :title="$t('system.user.settings.setUser')">
    <div class="transfer-wrapper">
      <!-- 左侧列表：待选择用户 -->
      <div class="transfer-panel">
        <div class="panel-header">
          <span>{{ $t('system.user.settings.beSelected') }}</span>
          <span class="panel-count">{{ leftPagination.total }}</span>
        </div>
        <div class="panel-search">
          <Input
            v-model:value="leftSearchText"
            :placeholder="$t('system.user.settings.searchTips')"
            allow-clear
          />
        </div>
        <div class="panel-content">
          <Spin :spinning="loading">
            <List
              :data-source="leftDataSource"
              :locale="{ emptyText: `'${$t('common.noData')}'` }"
              size="small"
            >
              <template #renderItem="{ item }">
                <List.Item
                  class="item-list"
                  :class="{
                    'is-selected': isSelected(item.id),
                  }"
                >
                  <div class="item-info">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-sub-title">{{ item.phone }}</div>
                    <div class="item-sub-title">{{ item.email }}</div>
                  </div>
                  <Button
                    v-if="!isSelected(item.id)"
                    type="link"
                    size="small"
                    @click="handleSelect(item.id)"
                  >
                    {{ $t('common.add') }}
                  </Button>
                  <span v-else class="added-tag">{{ $t('common.added') }}</span>
                </List.Item>
              </template>
            </List>
          </Spin>
        </div>
        <div class="panel-pagination">
          <Pagination
            v-model:current="leftPagination.current"
            :total="leftPagination.total"
            :page-size="leftPagination.pageSize"
            size="small"
            :show-size-changer="false"
            @change="handleLeftPageChange"
          />
        </div>
      </div>

      <!-- 右侧列表：已选择用户 -->
      <div class="transfer-panel">
        <div class="panel-header">
          <span>{{ $t('system.user.settings.selected') }}</span>
          <span class="panel-count">{{ selectedData.length }}</span>
        </div>
        <div class="panel-content">
          <List
            :data-source="selectedData"
            :locale="{ emptyText: `'${$t('common.noData')}'` }"
            size="small"
          >
            <template #renderItem="{ item }">
              <List.Item class="item-list">
                <div class="item-info">
                  <div class="item-title">{{ item.title }}</div>
                    <div class="item-sub-title">{{ item.phone }}</div>
                  <div class="item-sub-title">{{ item.email }}</div>
                </div>
                <Button
                  type="link"
                  danger
                  size="small"
                  @click="handleRemove(item.id)"
                >
                  {{ $t('common.remove') }}
                </Button>
              </List.Item>
            </template>
          </List>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style lang="css" scoped>
.transfer-wrapper {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.transfer-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.panel-count {
  font-size: 12px;
  color: #999;
}

.panel-search {
  padding: 8px 12px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-content {
  flex: 1;
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.panel-pagination {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid #e8e8e8;
}

:deep(.item-list) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px !important;
  transition: background-color 0.2s;
}

:deep(.item-list:hover) {
  background-color: #f5f5f5;
}

:deep(.item-list.is-selected) {
  background-color: #e6f7ff;
}

.item-info {
  flex: 1;
  min-width: 0;

  .item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    white-space: nowrap;
  }

  .item-sub-title {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }
}

.added-tag {
  font-size: 12px;
  color: #52c41a;
}
</style>
