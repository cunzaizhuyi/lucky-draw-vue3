<template>
  <div id="tool">
    <el-button @click="startHandler" type="primary" size="small">{{
      running ? '停止' : '开始'
    }}</el-button>
    <el-button size="small" @click="showRemoveoptions = true">
      重置
    </el-button>
    <el-button size="small" @click="showImport = true">
      导入名单
    </el-button>
    <el-button size="small" @click="showImportphoto = true">
      导入照片
    </el-button>
    <el-dialog
      :append-to-body="true"
      v-model="showSetwat"
      class="setwat-dialog"
      width="400px"
    >
      <el-form ref="formRef" :model="form" label-width="80px" size="small">
        <el-form-item label="抽取奖项">
          <el-select v-model="form.category" placeholder="请选取本次抽取的奖项">
            <el-option
              :label="item.label"
              :value="item.value"
              v-for="(item, index) in categorys"
              :key="index"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label=" " v-if="form.category">
          <span>
            共&nbsp;
            <span class="colorred">{{ config[form.category] }}</span>
            &nbsp;名
          </span>
          <span :style="{ marginLeft: '20px' }">
            剩余&nbsp;
            <span class="colorred">{{ remain }}</span>
            &nbsp;名
          </span>
        </el-form-item>

        <el-form-item label="抽取方式">
          <el-select v-model="form.mode" placeholder="请选取本次抽取方式">
            <el-option label="抽1人" :value="1"></el-option>
            <el-option label="抽5人" :value="5"></el-option>
            <el-option label="一次抽取完" :value="0"></el-option>
            <el-option label="自定义" :value="99"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="抽取人数" v-if="form.mode === 99">
          <el-input
            v-model="form.qty"
            type="number"
            :clearable="true"
            :min="1"
            :max="remain ? remain : 100"
            :step="1"
          ></el-input>
        </el-form-item>

        <el-form-item label="全员参与">
          <el-switch v-model="form.allin"></el-switch>
          <span :style="{ fontSize: '12px' }">
            (开启后将在全体成员[无论有无中奖]中抽奖)
          </span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit">立即抽奖</el-button>
          <el-button @click="showSetwat = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog
      :append-to-body="true"
      v-model="showImport"
      class="import-dialog"
      width="400px"
    >
      <el-input
        type="textarea"
        :rows="10"
        placeholder="请输入对应的号码和名单(可直接从excel复制)，格式(号码 名字)，导入的名单将代替号码显示在抽奖中。如：
1 张三
2 李四
3 王五
				"
        v-model="listStr"
      ></el-input>
      <div class="footer">
        <el-button size="small" type="primary" @click="transformList"
          >确定</el-button
        >
        <el-button size="small" @click="showImport = false">取消</el-button>
      </div>
    </el-dialog>
    <Importphoto
      v-model:visible="showImportphoto"
      @getPhoto="$emit('getPhoto')"
    ></Importphoto>

    <el-dialog
      v-model="showRemoveoptions"
      width="300px"
      class="c-removeoptions"
      :append-to-body="true"
    >
      <el-form ref="removeFormRef" :model="removeInfo" label-width="80px" size="small">
        <el-form-item label="重置选项">
          <el-radio-group v-model="removeInfo.type">
            <el-radio border :label="0">重置全部数据</el-radio>
            <el-radio border :label="1">重置抽奖配置</el-radio>
            <el-radio border :label="2">重置名单</el-radio>
            <el-radio border :label="3">重置照片</el-radio>
            <el-radio border :label="4">重置抽奖结果</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="resetConfig">确定重置</el-button>
          <el-button @click="showRemoveoptions = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useLuckyStore } from '@/stores';
import {
  clearData,
  removeData,
  configField,
  listField,
  resultField,
  conversionCategoryName
} from '@/helper/index';
import Importphoto from './Importphoto.vue';
import { database, DB_STORE_NAME } from '@/helper/db';

// 定义属性和事件
const props = defineProps({
  running: Boolean,
  closeRes: Function
});

const emit = defineEmits(['toggle', 'resetConfig', 'getPhoto']);

// 使用 Pinia store
const store = useLuckyStore();

// 响应式数据
const showSetwat = ref(false);
const showImport = ref(false);
const showImportphoto = ref(false);
const showRemoveoptions = ref(false);
const removeInfo = ref({ type: 0 });
const form = ref({
  category: '',
  mode: 1,
  qty: 1,
  allin: false
});
const listStr = ref('');
const formRef = ref(null);
const removeFormRef = ref(null);

// 计算属性
const config = computed(() => store.config);
const result = computed(() => store.result);

const remain = computed(() => {
  return (
    config.value[form.value.category] -
    (result.value[form.value.category]
      ? result.value[form.value.category].length
      : 0)
  );
});

const categorys = computed(() => {
  const options = [];
  for (const key in config.value) {
    if (Object.prototype.hasOwnProperty.call(config.value, key)) {
      const item = config.value[key];
      if (item > 0) {
        let name = conversionCategoryName(key);
        name &&
          options.push({
            label: name,
            value: key
          });
      }
    }
  }
  return options;
});

// 监听
watch(() => showRemoveoptions.value, (v) => {
  if (!v) {
    removeInfo.value.type = 0;
  }
});

// 方法
const resetConfig = () => {
  const type = removeInfo.value.type;
  ElMessageBox.confirm('此操作将重置所选数据，是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      switch (type) {
        case 0:
          clearData();
          store.setClearStore();
          database.clear(DB_STORE_NAME);
          break;
        case 1:
          removeData(configField);
          store.setClearConfig();
          break;
        case 2:
          removeData(listField);
          store.setClearList();
          break;
        case 3:
          database.clear(DB_STORE_NAME);
          store.setClearPhotos();
          break;
        case 4:
          removeData(resultField);
          store.setClearResult();
          break;
        default:
          break;
      }

      if (props.closeRes) props.closeRes();

      showRemoveoptions.value = false;
      ElMessage({
        type: 'success',
        message: '重置成功!'
      });

      nextTick(() => {
        emit('resetConfig');
      });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消'
      });
    });
};

const onSubmit = () => {
  if (!form.value.category) {
    return ElMessage.error('请选择本次抽取的奖项');
  }
  if (remain.value <= 0) {
    return ElMessage.error('该奖项剩余人数不足');
  }
  if (form.value.mode === 99) {
    if (form.value.qty <= 0) {
      return ElMessage.error('必须输入本次抽取人数');
    }
    if (form.value.qty > remain.value) {
      return ElMessage.error('本次抽奖人数已超过本奖项的剩余人数');
    }
  }
  if (form.value.mode === 1 || form.value.mode === 5) {
    if (form.value.mode > remain.value) {
      return ElMessage.error('本次抽奖人数已超过本奖项的剩余人数');
    }
  }
  showSetwat.value = false;
  emit(
    'toggle',
    Object.assign({}, form.value, { remain: remain.value })
  );
};

const startHandler = () => {
  emit('toggle');
  if (!props.running) {
    showSetwat.value = true;
  }
};

const transformList = () => {
  if (!listStr.value) {
    ElMessage.error('没有数据');
    return;
  }
  const list = [];
  const rows = listStr.value.split('\n');
  if (rows && rows.length > 0) {
    rows.forEach(item => {
      const rowList = item.split(/\t|\s/);
      if (rowList.length >= 2) {
        const key = Number(rowList[0].trim());
        const name = rowList[1].trim();
        key &&
          list.push({
            key,
            name
          });
      }
    });
  }
  store.setList(list);

  ElMessage({
    message: '保存成功',
    type: 'success'
  });
  showImport.value = false;
  nextTick(() => {
    emit('resetConfig');
  });
};
</script>

<style lang="scss" scoped>
#tool {
  position: fixed;
  width: 60px;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .el-button + .el-button {
    margin-top: 20px;
    margin-left: 0px;
  }
}



/* 修改为全局样式 */
</style>

<!-- 添加全局样式 -->
<style lang="scss">
.setwat-dialog {
  .colorred {
    color: red;
    font-weight: bold;
  }
}

.import-dialog {
  .footer {
    height: 50px;
    line-height: 50px;
    text-align: center;
  }
}

.c-removeoptions {
  .el-dialog {
    height: 290px;
  }
  .el-radio.is-bordered + .el-radio.is-bordered {
    margin-left: 0px;
  }
  .el-radio.is-bordered {
    margin-bottom: 10px;
  }
}
</style>
