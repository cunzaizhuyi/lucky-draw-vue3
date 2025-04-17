<template>
  <el-dialog
    v-model="dialogVisible"
    :append-to-body="true"
    width="300px"
    class="c-Importphoto"
  >
    <el-row>
      <label for="idinput">抽奖号码</label>
      <el-input
        id="idinput"
        size="small"
        type="number"
        v-model="id"
        :min="0"
        :max="config.number"
      ></el-input>
    </el-row>
    <el-row>
      <label for="idinput">照片选择</label>
      <span class="selectbg" :data-tip="filename">
        <input
          ref="uploadinput"
          class="upload"
          type="file"
          accept=".jpg,.png"
          @change="inputChange"
        />
      </span>
    </el-row>
    <el-row class="photo">
      <label>已选照片</label>
      <img v-if="value" :src="value" alt="img" :width="140" :height="140" />
      <span v-else>暂未选择</span>
    </el-row>
    <el-row>
      支持jpg和png，照片大小不能超过150kb,建议20-50kb，建议尺寸为160*160px
    </el-row>
    <el-row class="c-Importphoto-center">
      <el-button size="small" type="primary" @click="saveHandler"
        >保存</el-button
      >
      <el-button size="small" @click="closeDialog"
        >取消</el-button
      >
    </el-row>
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { useLuckyStore } from '@/stores';
import { database, DB_STORE_NAME } from '@/helper/db';

// 定义属性和事件
const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['update:visible', 'getPhoto']);

// 使用 Pinia store
const store = useLuckyStore();

// 响应式数据
const id = ref(0);
const value = ref('');
const filename = ref('点击选择照片');
const uploadinput = ref(null);

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const config = computed(() => store.config);

// 方法
const closeDialog = () => {
  dialogVisible.value = false;
};

const inputChange = (e) => {
  const fileList = e.target.files;
  const formData = new FormData();
  formData.append('uploadImg', fileList[0]);
  const reader = new FileReader();
  const AllowImgFileSize = 1024 * 150;
  const file = fileList[0];
  if (file) {
    filename.value = file.name;
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (AllowImgFileSize != 0 && AllowImgFileSize < reader.result.length) {
        return ElMessage.error('不允许上传大于150KB的图片');
      } else {
        value.value = reader.result;
      }
    };
  }
};

const saveHandler = async () => {
  const idValue = Number(id.value);
  if (!idValue || idValue <= 0) {
    return ElMessage.error('号码必须大于0的整数');
  }
  if (!value.value) {
    return ElMessage.error('请选择照片');
  }
  
  try {
    const Data = await database.get(DB_STORE_NAME, idValue);
    const param = {
      id: idValue,
      value: value.value
    };
    
    const res = await database[Data ? 'edit' : 'add'](
      DB_STORE_NAME,
      Data ? idValue : param,
      Data ? param : null
    );
    
    if (res) {
      if (uploadinput.value) {
        uploadinput.value.value = '';
      }
      value.value = '';
      filename.value = '点击选择照片';
      dialogVisible.value = false;
      emit('getPhoto');
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
    } else {
      ElMessage.error('保存失败');
    }
  } catch (err) {
    ElMessage.error(err.message);
  }
};
</script>

<style lang="scss" scoped>
.c-Importphoto {
  :deep(.el-dialog) {
    height: 380px;
  }
  label {
    margin-right: 20px;
    vertical-align: top;
  }
  .el-input {
    width: 140px;
  }
  .el-row {
    padding: 5px 0;
  }
  .selectbg {
    display: inline-block;
    border: 1px solid #ccc;
    border-radius: 2px;
    width: 140px;
    height: 28px;
    position: relative;
    box-sizing: border-box;
    &::before {
      content: attr(data-tip);
      width: 100%;
      height: 100%;
      text-align: center;
      position: absolute;
      top: 0;
      left: 0;
      line-height: 28px;
      cursor: pointer;
      overflow: hidden;
      font-size: 12px;
    }
    .upload {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 10;
      cursor: pointer;
    }
  }
  .photo {
    img {
      border: 1px solid #ccc;
    }
    span {
      display: inline-block;
      border: 1px solid #ccc;
      border-radius: 2px;
      width: 140px;
      height: 140px;
      line-height: 140px;
      text-align: center;
      position: relative;
      box-sizing: border-box;
    }
  }
}
</style>

<style lang="scss">
.c-Importphoto-center{
  justify-content: center;
}
</style>
