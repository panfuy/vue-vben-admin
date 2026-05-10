<script lang="ts" setup>import type { UserService } from '#/api/system/user';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, List, Pagination, Spin } from 'ant-design-vue';

import { saveTenantRef } from '#/api/system/tenant';
import { getUserListPage } from '#/api/system/user';

const emits = defineEmits(['success']);

const [Modal, modalApi] = useVbenModal({
  class: 'w-[700px] max-w-[90vw]',
  async onConfirm() {
    modalApi.lock();
    const selectedKeys = targetKeys.value;
    saveTenantRef('USER', id.value, { value: selectedKeys })
      .then(() => {
        emits('success');
        modalApi.close();
      })
      .catch(() => {
        modalApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ id: string; userIds: string[] }>();
      if (data) {
        id.value = data.id;
        targetKeys.value = data.userIds || [];
      } else {
        id.value = '';
        targetKeys.value = [];
      }
      await loadLeftUsers();
    }
  },
});

const id = ref<string>('');
const leftDataSource = ref<
  { email: string; id: string; name: string; }[]
>([]);
const targetKeys = ref<string[]>([]);
const loading = ref(false);
const leftSearchText = ref('');
const leftPagination = ref({ current: 1, pageSize: 10, total: 0 });

async function loadLeftUsers() {
  loading.value = true;
  try {
    const res = await getUserListPage({
      name: leftSearchText.value || undefined,
      currPage: leftPagination.value.current,
      pageSize: leftPagination.value.pageSize,
    } as any) as any;
    leftDataSource.value =
      res?.records?.map((user: UserService.UserVO) => ({
        id: user.id,
        email: user.email || '',
        name: user.name || '',
      })) || [];
    leftPagination.value.total = res?.total || 0;
  } finally {
    loading.value = false;
  }
}

watch(leftSearchText, () => {
  leftPagination.value.current = 1;
  loadLeftUsers();
});

function handleLeftPageChange(page: number) {
  leftPagination.value.current = page;
  loadLeftUsers();
}

function handleSelect(userId: string) {
  if (!targetKeys.value.includes(userId)) {
    targetKeys.value = [...targetKeys.value, userId];
  }
}

function handleRemove(userId: string) {
  targetKeys.value = targetKeys.value.filter((key) => key !== userId);
}

// 右侧已选择的用户（需要额外加载）
const selectedUsers = ref<{ email: string; id: string; name: string }[]>([]);

async function loadSelectedUsers() {
  if (targetKeys.value.length === 0) {
    selectedUsers.value = [];
    return;
  }
  // 根据已选择的用户ID加载详细信息
  const res = await getUserListPage({
    currPage: 1,
    pageSize: 1000,
  } as any) as any;
  const allUsers = res?.records || [];
  selectedUsers.value = targetKeys.value
    .map((id) => allUsers.find((u: UserService.UserVO) => u.id === id))
    .filter(Boolean)
    .map((user: UserService.UserVO) => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
    }));
}

watch(targetKeys, () => {
  loadSelectedUsers();
});
</script>
<template>
  <Modal title="关联用户">
    <div class="transfer-wrapper">
      <!-- 左侧列表：待选择用户 -->
      <div class="transfer-panel">
        <div class="panel-header">
          <span>待选择用户</span>
          <span class="panel-count">{{ leftPagination.total }}</span>
        </div>
        <div class="panel-search">
          <Input
            v-model:value="leftSearchText"
            placeholder="搜索用户名"
            allow-clear
          />
        </div>
        <div class="panel-content">
          <Spin :spinning="loading">
            <List
              :data-source="leftDataSource"
              :locale="{ emptyText: '暂无数据' }"
              size="small"
            >
              <template #renderItem="{ item }">
                <List.Item
                  class="user-item"
                  :class="{ 'is-selected': targetKeys.includes(item.id) }"
                >
                  <div class="user-info">
                    <div class="user-name">{{ item.name }}</div>
                    <div class="user-email">{{ item.email }}</div>
                  </div>
                  <Button
                    v-if="!targetKeys.includes(item.id)"
                    type="link"
                    size="small"
                    @click="handleSelect(item.id)"
                  >
                    添加
                  </Button>
                  <span v-else class="added-tag">已添加</span>
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
          <span>已选择用户</span>
          <span class="panel-count">{{ targetKeys.length }}</span>
        </div>
        <div class="panel-content">
          <List
            :data-source="selectedUsers"
            :locale="{ emptyText: '请从左侧添加用户' }"
            size="small"
          >
            <template #renderItem="{ item }">
              <List.Item class="user-item">
                <div class="user-info">
                  <div class="user-name">{{ item.name }}</div>
                  <div class="user-email">{{ item.email }}</div>
                </div>
                <Button type="link" danger size="small" @click="handleRemove(item.id)">
                  移除
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

:deep(.user-item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px !important;
  transition: background-color 0.2s;
}

:deep(.user-item:hover) {
  background-color: #f5f5f5;
}

:deep(.user-item.is-selected) {
  background-color: #e6f7ff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  white-space: nowrap;
}

.user-email {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.added-tag {
  font-size: 12px;
  color: #52c41a;
}
</style>
