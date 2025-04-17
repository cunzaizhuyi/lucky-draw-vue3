<template>
  <el-dialog
    v-model="dialogVisible"
    :append-to-body="true"
    width="390px"
    class="c-LotteryConfig"
  >
    <template #header>
      <div class="c-LotteryConfigtitle">
        <span :style="{ fontSize: '16px', marginRight: '20px' }">
          抽奖配置
        </span>
        <el-button size="small" @click="addLottery">增加奖项</el-button>
        <el-button size="small" type="primary" @click="onSubmit"
          >保存配置</el-button
        >
        <el-button size="small" @click="closeDialog"
          >取消</el-button
        >
      </div>
    </template>
    <div class="container">
      <el-form ref="formRef" :model="form" size="small">
        <el-form-item label="抽奖标题">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="抽奖总人数">
          <el-input
            type="number"
            v-model="form.number"
            :min="1"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item label="一等奖">
          <el-input
            type="number"
            v-model="form.firstPrize"
            :min="0"
            :step="1"
          ></el-input>
        </el-form-item>
        <el-form-item
          :label="newitem.name"
          v-for="newitem in storeNewLottery"
          :key="newitem.key"
        >
          <el-input
            type="number"
            :min="0"
            :step="1"
            v-model="form[newitem.key]"
            @change="
              val => {
                form[newitem.key] = Number(val);
              }
            "
          ></el-input>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog
      v-model="showAddLottery"
      :append-to-body="true"
      width="300px"
      class="dialog-showAddLottery"
    >
      <template #header>
        <div class="add-title">增加奖项</div>
      </template>
      <el-form ref="newLotteryRef" :model="newLottery" size="small">
        <el-form-item label="奖项名称">
          <el-input v-model="newLottery.name"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addHandler">增加奖项</el-button>
          <el-button @click="showAddLottery = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { useLuckyStore } from '@/stores';
import { setData, configField } from '@/helper/index';
import { randomNum } from '@/helper/algorithm';

// 定义属性和事件
const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['update:visible', 'resetconfig']);

// 使用 Pinia store
const store = useLuckyStore();

// 响应式数据
const showAddLottery = ref(false);
const newLottery = ref({ name: '' });
const formRef = ref(null);
const newLotteryRef = ref(null);

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const form = computed({
  get: () => store.config,
  set: (val) => val
});

const storeNewLottery = computed(() => store.newLottery);

// 方法
const closeDialog = () => {
  dialogVisible.value = false;
};

const onSubmit = () => {
  setData(configField, form.value);
  store.setConfig(form.value);
  dialogVisible.value = false;

  ElMessage({
    message: '保存成功',
    type: 'success'
  });

  nextTick(() => {
    emit('resetconfig');
  });
};

const addLottery = () => {
  showAddLottery.value = true;
};

const randomField = () => {
  const str = 'abcdefghijklmnopqrstuvwxyz';
  let fieldStr = '';
  for (let index = 0; index < 10; index++) {
    fieldStr += str.split('')[randomNum(1, 27) - 1];
  }
  return `${fieldStr}${Date.now()}`;
};

const addHandler = () => {
  const field = randomField();
  const data = {
    key: field,
    name: newLottery.value.name
  };
  store.setNewLottery(data);

  showAddLottery.value = false;
};
</script>

<style lang="scss" scoped>
.c-LotteryConfig {
  :deep(.el-dialog__body) {
    height: 340px;
    .container {
      height: 100%;
      overflow-y: auto;
      padding: 0 10px;
    }
  }
}

:deep(.dialog-showAddLottery) {
  .el-dialog {
    height: 186px;
  }
}
</style>
