<template>
  <el-dialog
    :modelValue="visible"
    @update:modelValue="$emit('update:visible', $event)"
    width="800px"
    class="c-Result"
  >
    <div class="result-container">
      <div v-for="(item, key) in result" :key="key" class="result-item">
        <div class="title">{{ conversionCategoryName(key) }}抽奖结果：</div>
        <div class="content">
          <div
            v-for="(res, i) in item"
            :key="i"
            class="item"
            :class="{
              numberOver:
                !!photos.find((d) => d.id === res) ||
                !!list.find((d) => d.key === res),
            }"
            :data-id="res"
          >
            <span v-if="!photos.find((d) => d.id === res)">
              <span v-if="!!list.find((d) => d.key === res)">
                {{ list.find((d) => d.key === res).name }}
              </span>
              <span v-else>
                {{ res }}
              </span>
            </span>
            <img
              v-if="photos.find((d) => d.id === res)"
              :src="photos.find((d) => d.id === res).value"
              alt="photo"
              :width="80"
              :height="80"
            />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { useLuckyStore } from '@/stores';
import { conversionCategoryName } from '@/helper/index';

// 定义属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['update:visible']);

// 使用 Pinia store
const store = useLuckyStore();

// 计算属性
const result = computed(() => store.result);
const list = computed(() => store.list);
const photos = computed(() => store.photos);
</script>

<style lang="scss" scoped>
.c-Result {
  .result-container {
    max-height: 500px;
    overflow-y: auto;
    .result-item {
      margin-bottom: 20px;
      .title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .content {
        display: flex;
        flex-wrap: wrap;
        .item {
          width: 80px;
          height: 80px;
          line-height: 80px;
          text-align: center;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-right: 10px;
          margin-bottom: 10px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          &.numberOver::before {
            content: attr(data-id);
            width: 20px;
            height: 16px;
            line-height: 16px;
            background-color: #fff;
            position: absolute;
            bottom: 0;
            left: 0;
            font-size: 12px;
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>
