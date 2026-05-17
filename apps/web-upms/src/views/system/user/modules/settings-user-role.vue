<script lang="ts" setup>
import type { RoleService } from '#/api/system/role';
import type { UserService } from '#/api/system/user';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Button,
  Empty,
  Input,
  List,
  message,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';

import { VO } from '#/api/common/vo/base';
import { getRoleListPage } from '#/api/system/role';
import {
  getUserAllListPage,
  getUserListPage,
  getUserListRolesByIds,
} from '#/api/system/user';
import { convertRoleItem, convertUserItem, Item } from '#/views/system/common';

// 响应的事件
const emits = defineEmits(['success']);
// 切换租户ID，为空时表示不要切换
const switchTenantId = ref<string>('');
const leftLoading = ref(false);
// 传入的待处理ID
const handerId = ref<string>('');
// 左侧待选择的用户
const leftSearchText = ref('');
const leftDataSource = ref<Item.User[]>([]);
const leftPagination = ref<VO.PageVO>({ current: 1, pageSize: 10, total: 0 });
// 左侧已选择的用户
const leftDataSelected = ref<Item.User[]>([]);

// 当前选中的用户ID
const currentUserId = ref<string>('');
const roleLoading = ref(false);
// 角色列表（用于下拉选择）
const roleListData = ref<Item.Role[]>([]);
// 角色搜索关键字
const roleSearchText = ref('');
const roleSearchData = ref<Item.Role[]>([]);

function buildBatchVO(): VO.BatchVO<Item.User> {
  const creates: Item.User[] = [];
  const updates: Item.User[] = [];
  const deletes: Item.User[] = [];

  for (const user of leftDataSelected.value) {
    // 规则1：用户本身有 create 或 delete 动作，直接归入对应数组
    if (user.action === Item.ActionType.CREATE) {
      user.roles = getUserRoles(user.roles);
      creates.push(user);
      continue;
    }
    if (user.action === Item.ActionType.DELETE) {
      user.roles = [];
      deletes.push(user);
      continue;
    }
    // 规则2：用户下角色有变化的（action不为空）标识有更新
    const changedRoles = user.roles?.filter((r) => r.id && r.action);
    if (changedRoles && changedRoles.length > 0) {
      // 产生一条 update 记录，携带非删除状态的角色
      updates.push({
        ...user,
        action: Item.ActionType.UPDATE,
        roles: getUserRoles(user.roles),
      });
    }
    // 其它为未改动，直接跳过
  }
  return { creates, updates, deletes };
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px] max-w-[90vw]',
  async onConfirm() {
    modalApi.lock();
    const isAndEmptyRoles = getUsers().some(
      (u) => getUserRoles(u.roles).length === 0,
    );
    // 若是用户对应的角色ids为空，弹出提示阻止提交
    if (isAndEmptyRoles) {
      message.error(`${$t('system.user.message.noselectRoles')}`);
      modalApi.unlock();
      return;
    }
    // 回传提交数据
    const batchVO = buildBatchVO();
    emits('success', handerId.value, { batchVO }, switchTenantId.value);
    modalApi.close();
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{
        id: string;
        switchTenantId: string;
        userIds: string[];
      }>();
      if (data) {
        switchTenantId.value = data.switchTenantId;
        handerId.value = data.id;
        await loadSelectedData(data.userIds || []);
      } else {
        switchTenantId.value = '';
        handerId.value = '';
        leftDataSelected.value = [];
      }
      currentUserId.value = '';
      await nextTick();

      if (data) {
        await loadLeftData();
      }
    }
  },
});

async function loadSelectedData(selectedIds: string[]) {
  if (selectedIds.length === 0) {
    leftDataSelected.value = [];
    return;
  }
  // 根据已选择的用户ID加载详细信息
  const res = (await getUserListRolesByIds(
    selectedIds,
    VO.createTenantHeader(switchTenantId.value),
  )) as UserService.UserVO[];
  leftDataSelected.value = convertUserItem(res || []);
}

async function loadLeftData() {
  leftLoading.value = true;
  try {
    const res = (await (
      switchTenantId.value ? getUserAllListPage : getUserListPage
    )({
      condition: leftSearchText.value || undefined,
      current: leftPagination.value.current,
      pageSize: leftPagination.value.pageSize,
    } as any)) as VO.PageVO<UserService.UserVO>;
    leftDataSource.value = convertUserItem(res?.records || []);
    leftPagination.value.total = res?.total || 0;
  } finally {
    leftLoading.value = false;
  }
}

// 加载角色列表数据（用于下拉选择）
async function loadRoleListData(searchText?: string) {
  roleLoading.value = true;
  try {
    const res = (await getRoleListPage(
      {
        current: 1,
        pageSize: 100,
        condition: searchText || undefined,
      },
      VO.createTenantHeader(switchTenantId.value),
    )) as VO.PageVO<RoleService.RoleVO>;
    (isRoleSearchNotEmpty() ? roleSearchData : roleListData).value =
      convertRoleItem(res?.records || []);
  } finally {
    roleLoading.value = false;
  }
}

// 角色搜索防抖定时器
let roleSearchTimer: null | ReturnType<typeof setTimeout> = null;
// 角色搜索处理
function handleRoleSearch(value: string) {
  if (roleSearchTimer) {
    clearTimeout(roleSearchTimer);
  }
  roleSearchTimer = setTimeout(() => {
    roleSearchText.value = value;
    loadRoleListData(value);
  }, 300);
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
      leftDataSelected.value = [
        ...leftDataSelected.value,
        { ...item, roles: [], action: Item.ActionType.CREATE },
      ];
      handleUserClick(id);
    }
  }
}

function handleRemove(id: string) {
  // 如果删除的是当前选中的用户，清除选中状态
  if (currentUserId.value === id) {
    currentUserId.value = '';
  }
  // 筛选出所有不满足条件的元素，生成新数组
  const newSelectedData = leftDataSelected.value;
  newSelectedData
    .filter((u) => u.id === id)
    .forEach((u) => {
      u.action = Item.ActionType.DELETE;
    });
  const noDeleteData = getUsers();
  if (noDeleteData && noDeleteData[0]) {
    // 删除后选中第一个用户
    handleUserClick(noDeleteData[0].id);
  } else {
    // 没有用户列表时，清空选中状态
    currentUserId.value = '';
  }
}

// 判断数组中是否存在符合条件的元素
const isSelected = (id: string) => {
  if (!id || leftDataSelected.value.length === 0) {
    return false;
  }
  return getUsers().some((u) => u.id === id);
};

// 点击用户行选中用户
async function handleUserClick(id: string) {
  if (currentUserId.value === id) {
    return;
  }
  currentUserId.value = id;
  if (id) {
    // 加载角色列表（动态加载）
    await loadRoleListData();
  }
}

// 判断用户是否当前选中
const isCurrentSelected = (id: string) => {
  return currentUserId.value === id;
};

// 获取当前选中用户的角色列表
const getCurrentUserRoles = () => {
  const user = getUsers().find((u) => u.id === currentUserId.value);
  return getUserRolesAndEmpty(user?.roles);
};

// 添加角色
async function handleAddRole() {
  const user = leftDataSelected.value.find((u) => u.id === currentUserId.value);
  if (user) {
    if (!user.roles) {
      user.roles = [];
    }
    user.roles.push({
      id: '',
      title: '',
      description: '',
      action: Item.ActionType.CREATE,
    });
    // 重置角色列表（动态加载）
    await loadRoleListData();
  }
}

// 移除角色
function handleRemoveRole(index: number) {
  const user = leftDataSelected.value.find((u) => u.id === currentUserId.value);
  const role =
    user?.roles && user?.roles.length - 1 >= index
      ? user?.roles[index]
      : undefined;
  if (!role?.id) {
    // id为空的直接删除
    user?.roles?.splice(index, 1);
    return;
  }
  if (role) {
    role.action = Item.ActionType.DELETE;
  }
}

function isRoleSearchNotEmpty() {
  return roleSearchText.value && roleSearchText.value.length > 0;
}

function getRoleListData() {
  return isRoleSearchNotEmpty() ? roleSearchData.value : roleListData.value;
}

// 角色选择变更
function handleRoleChange(roleId: string | undefined, index: number) {
  // 移除空角色ID
  if (!roleId) {
    handleRemoveRole(index);
    return;
  }
  const role = getRoleListData().find((r) => r.id === roleId);
  const user = leftDataSelected.value.find((u) => u.id === currentUserId.value);
  if (role && user?.roles) {
    // 创建新对象而不是使用引用，避免roleListData更新时影响用户角色数据
    user.roles[index] = {
      id: role.id,
      title: role.title,
      description: role.description,
      action: Item.ActionType.CREATE,
    };
  }
}

/**
 * 可用的角色选项（从roleListData获取，包含已选中的角色，已选中角色禁用）
 */
const availableRoleOptions = computed(() => {
  const currentUser = leftDataSelected.value.find(
    (u) => u.id === currentUserId.value,
  );
  const userRoles = currentUser?.roles || [];
  // 已选中的角色ID集合（排除当前正在编辑的项）
  const selectedRoleIds = new Set(getUserRoles(userRoles).map((r) => r.id));

  // 合并可选角色列表和用户已选择的角色，确保已选中的角色能显示
  const roleIds = new Set(getRoleListData().map((r) => r.id));
  const selectedRolesNotInList = getUserRoles(userRoles).filter(
    (r) => !roleIds.has(r.id),
  );
  const allRoles = [...getRoleListData(), ...selectedRolesNotInList];

  return allRoles.map((role) => ({
    value: role.id,
    label: role.title,
    disabled: selectedRoleIds.has(role.id),
  }));
});

function handlerRoleFocus() {
  // 角色搜索时清空筛选条件
  roleSearchText.value = '';
}

/**
 * 获取用户下的角色集合
 * @param roles 待判断的对象
 * @returns 角色集合
 */
function getUserRoles(roles?: Item.Role[]) {
  return getUserRolesAndEmpty(roles).filter((r) => r.id) || [];
}
function getUserRolesAndEmpty(roles?: Item.Role[]) {
  return roles?.filter((r) => r.action !== Item.ActionType.DELETE) || [];
}

function getUsers() {
  return (
    leftDataSelected.value.filter((r) => r.action !== Item.ActionType.DELETE) ||
    []
  );
}

// 当前用户是否可以编辑角色
const canEditRole = computed(() => {
  return !!currentUserId.value;
});
</script>
<template>
  <Modal :title="$t('system.user.settings.setUserRole')">
    <div class="user-role-wrapper">
      <!-- 左侧：用户列表 -->
      <div class="user-panel">
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
          <Spin :spinning="leftLoading">
            <List
              :data-source="leftDataSource"
              :locale="{ emptyText: `'${$t('common.noData')}'` }"
              size="small"
            >
              <template #renderItem="{ item }">
                <List.Item
                  class="item-list"
                  :class="{ 'is-selected': isSelected(item.id) }"
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

      <!-- 中间：已选用户列表 + 角色配置 -->
      <div class="selected-panel">
        <div class="panel-header">
          <span>{{ $t('system.user.settings.selected') }}</span>
          <span class="panel-count">{{ getUsers().length }}</span>
        </div>
        <div class="panel-content">
          <List
            v-if="getUsers().length > 0"
            :data-source="getUsers()"
            size="small"
          >
            <template #renderItem="{ item }">
              <List.Item
                class="item-list"
                :class="{ 'is-current-selected': isCurrentSelected(item.id) }"
                @click="handleUserClick(item.id)"
              >
                <div class="item-info">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-sub-title">{{ item.phone }}</div>
                  <div class="item-sub-title">{{ item.email }}</div>
                </div>
                <Tag
                  :color="
                    getUserRoles(item.roles).length > 0 ? 'blue' : '#ff3860'
                  "
                >
                  {{ getUserRoles(item.roles).length
                  }}{{ $t('system.user.settings.roleTitle') }}
                </Tag>
                <Button
                  type="link"
                  danger
                  size="small"
                  @click.stop="handleRemove(item.id)"
                >
                  {{ $t('common.remove') }}
                </Button>
              </List.Item>
            </template>
          </List>
          <Empty v-else class="empty-list" :description="$t('common.noData')" />
        </div>
      </div>

      <!-- 右侧：角色配置区域 -->
      <div class="role-panel" :class="{ 'is-disabled': !canEditRole }">
        <div class="panel-header">
          <span>{{ $t('system.role.settings.setRole') }}</span>
          <Button
            v-if="canEditRole"
            type="link"
            size="small"
            @click="handleAddRole"
          >
            {{ $t('common.add') }}{{ $t('system.user.settings.roleTitle') }}
          </Button>
        </div>
        <div class="panel-content">
          <Spin :spinning="roleLoading">
            <!-- 当前选中用户的角色列表（通过函数获取） -->
            <div
              v-if="canEditRole && getCurrentUserRoles().length > 0"
              class="role-list"
            >
              <div
                v-for="(role, index) in getCurrentUserRoles()"
                :key="role?.id ?? index"
                class="role-item"
              >
                <Select
                  class="role-select"
                  show-search
                  :value="role.id"
                  :options="availableRoleOptions"
                  :placeholder="$t('system.user.settings.selectRole')"
                  :filter-option="() => true"
                  @focus="handlerRoleFocus"
                  @search="handleRoleSearch"
                  @change="handleRoleChange($event as any, index)"
                />
                <Button
                  type="link"
                  danger
                  size="small"
                  @click="handleRemoveRole(index)"
                >
                  {{ $t('common.remove') }}
                </Button>
              </div>
            </div>
            <Empty
              v-if="canEditRole && getCurrentUserRoles().length <= 0"
              class="empty-list"
              :description="$t('common.noData')"
            />
            <Empty
              v-if="!canEditRole"
              class="empty-list"
              :description="$t('system.user.settings.selectUserTip')"
            />
          </Spin>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style lang="css" scoped>
.user-role-wrapper {
  display: flex;
  gap: 12px;
  min-height: 500px;
  padding: 16px;
}

.user-panel,
.selected-panel,
.role-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.user-panel {
  flex: 1;
  min-width: 220px;
}

.selected-panel {
  flex: 1.2;
  min-width: 280px;
}

.role-panel {
  flex: 1;
  min-width: 220px;
}

.role-panel.is-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;

  button {
    height: 18px;
  }
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
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.item-list:hover) {
  background-color: #f5f5f5;
}

:deep(.item-list.is-selected) {
  background-color: #e6f7ff;
}

:deep(.item-list.is-current-selected) {
  background-color: #fff1b8b7;
  border-left: 3px solid #faad14b4;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info .item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  white-space: nowrap;
}

.item-info .item-sub-title {
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

/* 角色列表样式 */
.role-list {
  padding: 8px;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-select {
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.empty-list {
  padding: 20px;
}
</style>
