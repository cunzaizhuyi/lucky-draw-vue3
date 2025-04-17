<template>
  <div id="root">
    <header>
      <Publicity v-show="!running" />
      <el-button class="res" type="text" @click="showResult = true">
        抽奖结果
      </el-button>
      <el-button class="con" type="text" @click="showConfig = true">
        抽奖配置
      </el-button>
    </header>
    <div id="main" :class="{ mask: showRes }"></div>
    <div id="tags">
      <ul v-for="item in datas" :key="item.key">
        <li>
          <a
            href="javascript:void(0);"
            :style="{
              color: '#fff',
            }"
          >
            {{ item.name ? item.name : item.key }}
            <img v-if="item.photo" :src="item.photo" :width="50" :height="50" />
          </a>
        </li>
      </ul>
    </div>
    <transition name="bounce">
      <div id="resbox" v-show="showRes">
        <p @click="showRes = false">{{ categoryName }}抽奖结果：</p>
        <div class="container">
          <span
            v-for="item in resArr"
            :key="item"
            class="itemres"
            :style="resCardStyle"
            :data-id="item"
            @click="showRes = false"
            :class="{
              numberOver:
                !!photos.find((d) => d.id === item) ||
                !!list.find((d) => d.key === item),
            }"
          >
            <span class="cont" v-if="!photos.find((d) => d.id === item)">
              <span
                v-if="!!list.find((d) => d.key === item)"
                :style="{
                  fontSize: '40px',
                }"
              >
                {{ list.find((d) => d.key === item).name }}
              </span>
              <span v-else>
                {{ item }}
              </span>
            </span>
            <img
              v-if="photos.find((d) => d.id === item)"
              :src="photos.find((d) => d.id === item).value"
              alt="photo"
              :width="160"
              :height="160"
            />
          </span>
        </div>
      </div>
    </transition>

    <el-button
      class="audio"
      type="text"
      @click="playAudio(!audioPlaying)"
    >
      <i
        class="iconfont"
        :class="[audioPlaying ? 'iconstop' : 'iconplay1']"
      ></i>
    </el-button>

    <LotteryConfig v-model:visible="showConfig" @resetconfig="reloadTagCanvas" />
    <Tool
      @toggle="toggle"
      @resetConfig="reloadTagCanvas"
      @getPhoto="getPhoto"
      :running="running"
      :closeRes="closeRes"
    />
    <Result v-model:visible="showResult"></Result>

    <span class="copy-right">
      Copyright©feiye
    </span>

    <audio
      id="audiobg"
      preload="auto"
      controls
      autoplay
      loop
      @play="playHandler"
      @pause="pauseHandler"
    >
      <source :src="audioSrc" />
      你的浏览器不支持audio标签
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useLuckyStore } from '@/stores';
import LotteryConfig from '@/components/LotteryConfig.vue';
import Publicity from '@/components/Publicity.vue';
import Tool from '@/components/Tool.vue';
import bgaudio from '@/assets/bg.mp3';
import beginaudio from '@/assets/begin.mp3';
import {
  getData,
  configField,
  resultField,
  newLotteryField,
  conversionCategoryName,
  listField,
} from '@/helper/index';
import { luckydrawHandler } from '@/helper/algorithm';
import Result from '@/components/Result.vue';
import { database, DB_STORE_NAME } from '@/helper/db';

// 状态管理
const store = useLuckyStore();

// 响应式数据
const running = ref(false);
const showRes = ref(false);
const showConfig = ref(false);
const showResult = ref(false);
const resArr = ref([]);
const category = ref('');
const audioPlaying = ref(false);
const audioSrc = ref(bgaudio);

// 计算属性
const resCardStyle = computed(() => {
  const style = { fontSize: '30px' };
  const { number } = store.config;
  if (number < 100) {
    style.fontSize = '100px';
  } else if (number < 1000) {
    style.fontSize = '80px';
  } else if (number < 10000) {
    style.fontSize = '60px';
  }
  return style;
});

const config = computed(() => store.config);
const result = computed({
  get: () => store.result,
  set: (val) => store.setResult(val)
});
const list = computed(() => store.list);
const photos = computed(() => store.photos);

const allresult = computed(() => {
  let results = [];
  for (const key in result.value) {
    if (Object.prototype.hasOwnProperty.call(result.value, key)) {
      const element = result.value[key];
      results = results.concat(element);
    }
  }
  return results;
});

const datas = computed(() => {
  const { number } = config.value;
  const nums = number >= 1500 ? 500 : number;
  const configNum = number > 1500 ? Math.floor(number / 3) : number;
  const randomShowNums = luckydrawHandler(configNum, [], nums);
  const randomShowDatas = randomShowNums.map((item) => {
    const listData = list.value.find((d) => d.key === item);
    const photo = photos.value.find((d) => d.id === item);
    return {
      key: item * (number > 1500 ? 3 : 1),
      name: listData ? listData.name : '',
      photo: photo ? photo.value : '',
    };
  });
  return randomShowDatas;
});

const categoryName = computed(() => conversionCategoryName(category.value));

// 生命周期钩子
onMounted(() => {
  startTagCanvas();
  setTimeout(() => {
    getPhoto();
  }, 1000);
  window.addEventListener('resize', reportWindowSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', reportWindowSize);
});

// 初始化数据
const initData = () => {
  const data = getData(configField);
  if (data) {
    store.setConfig(Object.assign({}, data));
  }
  
  const resultData = getData(resultField);
  if (resultData) {
    store.setResult(resultData);
  }

  const newLottery = getData(newLotteryField);
  if (newLottery) {
    const configData = config.value;
    newLottery.forEach((item) => {
      store.setNewLottery(item);
      if (!configData[item.key]) {
        configData[item.key] = 0;
      }
    });
    store.setConfig(configData);
  }

  const listData = getData(listField);
  if (listData) {
    store.setList(listData);
  }
};
initData();

// 监听照片变化
watch(photos, () => {
  nextTick(() => {
    reloadTagCanvas();
  });
}, { deep: true });

// 方法
const reportWindowSize = () => {
  const AppCanvas = document.querySelector('#rootcanvas');
  if (AppCanvas && AppCanvas.parentElement) {
    AppCanvas.parentElement.removeChild(AppCanvas);
  }
  startTagCanvas();
};

const playHandler = () => {
  audioPlaying.value = true;
};

const pauseHandler = () => {
  audioPlaying.value = false;
};

const playAudio = (type) => {
  const audioBg = document.querySelector('#audiobg');
  if (type) {
    audioBg.play();
  } else {
    audioBg.pause();
  }
};

const loadAudio = () => {
  const audioBg = document.querySelector('#audiobg');
  audioBg.load();
  nextTick(() => {
    audioBg.play();
  });
};

const getPhoto = () => {
  database.getAll(DB_STORE_NAME).then((res) => {
    if (res && res.length > 0) {
      store.setPhotos(res);
    }
  });
};

const speed = () => {
  return [0.1 * Math.random() + 0.01, -(0.1 * Math.random() + 0.01)];
};

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = document.body.offsetWidth;
  canvas.height = document.body.offsetHeight - 50; // header的高度
  canvas.id = 'rootcanvas';
  document.querySelector('#main').appendChild(canvas);
};

const startTagCanvas = () => {
  createCanvas();
  window.TagCanvas.Start('rootcanvas', 'tags', {
    textColour: null,
    initial: speed(),
    dragControl: 1,
    textHeight: 20,
    noSelect: true,
    lock: 'xy',
  });
};

const reloadTagCanvas = () => {
  window.TagCanvas.Reload('rootcanvas');
};

const closeRes = () => {
  showRes.value = false;
};

const toggle = (form) => {
  if (running.value) {
    audioSrc.value = bgaudio;
    loadAudio();

    window.TagCanvas.SetSpeed('rootcanvas', speed());
    showRes.value = true;
    running.value = !running.value;
    nextTick(() => {
      reloadTagCanvas();
    });
  } else {
    showRes.value = false;
    if (!form) {
      return;
    }

    audioSrc.value = beginaudio;
    loadAudio();

    const { number } = config.value;
    const { category: cat, mode, qty, remain, allin } = form;
    let num = 1;
    if (mode === 1 || mode === 5) {
      num = mode;
    } else if (mode === 0) {
      num = remain;
    } else if (mode === 99) {
      num = qty;
    }
    const resultArray = luckydrawHandler(
      number,
      allin ? [] : allresult.value,
      num
    );
    resArr.value = resultArray;

    category.value = cat;
    if (!result.value[cat]) {
      result.value[cat] = [];
    }
    const oldRes = result.value[cat] || [];
    const data = Object.assign({}, result.value, {
      [cat]: oldRes.concat(resultArray),
    });
    result.value = data;
    window.TagCanvas.SetSpeed('rootcanvas', [5, 1]);
    running.value = !running.value;
  }
};
</script>

<style lang="scss">
#root {
  height: 100%;
  position: relative;
  background-image: url('./assets/bg1.jpg');
  background-size: 100% 100%;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #121936;
  .mask {
    -webkit-filter: blur(5px);
    filter: blur(5px);
  }
  header {
    height: 50px;
    line-height: 50px;
    position: relative;
    .el-button {
      position: absolute;
      top: 10px;
      padding: 0;
      z-index: 9999;
      &.con {
        right: 20px;
      }
      &.res {
        right: 100px;
      }
    }
  }
  .audio {
    position: absolute;
    top: 100px;
    right: 30px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    border: 1px solid #fff;
    border-radius: 50%;
    padding: 0;
    text-align: center;
    .iconfont {
      position: relative;
      left: 1px;
    }
  }
  .copy-right {
    position: absolute;
    right: 10px;
    bottom: 10px;
    color: #ccc;
    z-index: 1000;
    font-size: 12px;
  }
  #audiobg{
    position: absolute;
    left: 10px;
    bottom: -100px;
  }
  .bounce-enter-active {
    animation: bounce-in 1.5s;
  }
  .bounce-leave-active {
    animation: bounce-in 0s reverse;
  }
}
#main {
  height: 100%;
}

#resbox {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1280px;
  transform: translateX(-50%) translateY(-50%);
  text-align: center;
  p {
    color: red;
    font-size: 50px;
    line-height: 120px;
  }
  .container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  .itemres {
    background: #fff;
    width: 160px;
    height: 160px;
    border-radius: 4px;
    border: 1px solid #ccc;
    line-height: 160px;
    font-weight: bold;
    margin-right: 20px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    .cont {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    &.numberOver::before {
      content: attr(data-id);
      width: 30px;
      height: 22px;
      line-height: 22px;
      background-color: #fff;
      position: absolute;
      bottom: 0;
      left: 0;
      font-size: 14px;
      z-index: 1;
    }
  }
}
</style>
