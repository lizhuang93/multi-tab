多tab滚动容器，基于better-scroll实现，支持位置保持，侧滑切tab，tab自动吸顶等功能。
## 在线演示
[http://39.98.139.162:3001/demo](http://39.98.139.162:3001/demo)
![](./zaixianyulan.jpg)
## 本地运行
1. git clone
2. yarn install
3. yarn dev
4. 0.0.0.0:8000

## 说明
基于better-scroll实现。
只接入了上拉加载更多的功能，需要更多功能请看 [https://better-scroll.github.io/docs/zh-CN/plugins/](https://better-scroll.github.io/docs/zh-CN/plugins/)

## 接入
npm i huge-tree --save 或 yarn add huge-tree -D
```
<multi-tab :tabList="tabList" v-model="tabIndex" @click="onClick">
  <div
    slot="header"
    style="height:150px;background:#a8a8a8;position:sticky;top:0; display:flex;justify-content: center;align-items: center;"
  >
    header区域
  </div>
  <!-- <div slot="nav">自定义tabs</div> -->
  <div v-for="(item, index) in tabList" :slot="index" :key="index" style="min-height: 1px">
    <page :ref="`page${index}`"></page>
  </div>
</multi-tab>

import MultiTab from 'multi-tab'
export default {
  components: {
    'multi-tab': MultiTab
  }
}
```

## 参考demo
[src/library/components/multiTab/demo](https://github.com/lizhuang93/multi-tab/blob/master/src/library/components/multiTab/demo/index.vue)

## Attributes

| 参数            | 说明        | 类型           | 可选值      | 默认值               |
| ------------ | -------------------- | -------------- | -------------------------- | -------------------- |
| v-model        | 当前选中的tab下标 | Number        | --         | 0                |
| tabList        | tabs数组 | Array        | --         | []                |
| isSticky        | 自动吸顶 | Boolean        | --         | true                |
| tidy        | 吸顶的前提下，开启 上滑自动隐藏tab，下滑自动展示tab功能。 | Boolean        | --         | false                |
| stickyTop        | 吸顶距离 | Number        | --         | 0                |
   
## 方法
将bsBody挂载到了Vue，子组件可之间this.bsBody使用。
Vue.prototype.bsBody = this.bsBody;
【注意】当tab页高度变化时，请调用 ```this.bsBody.updateHeight();```

## Events

| 事件名称        | 说明                                   | 回调参数                         |
| --------------- | -------------------------------------- | -------------------------------- |
| click        | 点击tab触发                       | index |

## Scoped Slot

| name      | 说明                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| header   | tab以上部分的slot， eg： `<div slot="header">HEADER</div>` |
| nav | 自定义的nav， eg： `<div slot="nav"></div>`                               |
| ${index}   | 0-n, 嵌入每一页， eg： ```<div v-for="(item, index) in tabList" :slot="index" :key="index" style="min-height: 1px"><page :ref="`page${index}`"></page></div>```                                         |


## 参考
[https://juejin.cn/post/7008356543444254757](https://juejin.cn/post/7008356543444254757)
[https://market.m.taobao.com/app/idleFish-F2e/mini-3c/home.html](https://market.m.taobao.com/app/idleFish-F2e/mini-3c/home.html)

