<template>
  <div class="c-Publicity">
    <el-carousel
      height="50px"
      :autoplay="true"
      indicator-position="none"
      arrow="never"
      :interval="3000"
    >
      <el-carousel-item v-for="item in message" :key="item.key">
        <div class="item" :class="{ actiname: item.key === 0 }">
          <span v-if="item.title" class="title"> {{ item.title }}</span>
          <span v-if="item.value" class="value">
            {{ item.value }}
          </span>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLuckyStore } from '@/stores';
import { conversionCategoryName } from '@/helper/index';

// 使用 Pinia store
const store = useLuckyStore();

// 计算属性
const config = computed(() => store.config);
const result = computed(() => store.result);

const message = computed(() => {
  const fields = Object.keys(config.value);
  
  let messageList = [{ key: 0, title: config.value.name }];
  fields.forEach((item, index) => {
    let label = conversionCategoryName(item);
    if (result.value[item] && config.value[item] > 0) {
      messageList.push({
        key: index + 1,
        title: `${label}抽奖结果:`,
        value: `${
          result.value[item].length > 0 ? result.value[item].join('、') : '暂未抽取'
        }`
      });
    }
  });

  return messageList;
});
</script>

<style lang="scss" scoped>
.c-Publicity {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  
  :deep(.el-carousel) {
    width: 80vw;
    margin: 0 auto;
  }
  
  .item {
    text-align: center;
    color: #fff;
    font-size: 16px;
    
    .title {
      color: #ccc;
    }
    
    .value {
      margin-left: 10px;
    }
    
    &.actiname {
      .title {
        color: red;
        font-size: 20px;
      }
    }
  }
}
</style>
