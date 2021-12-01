<template>
  <div class="nav-wrap" ref="tabs" v-if="tabList.length > 0" :style="styleTabs">
    <div
      class="item"
      :class="{ active: value === idx }"
      v-for="(tab, idx) in tabList"
      :key="tab.label"
      @click="$emit('click', idx)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    tabList: {
      type: Array,
      default: () => [],
    },
    value: {
      type: Number,
      default: 0,
    },
    styleTabs: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {};
  },

  computed: {},

  mounted() {},

  methods: {},
};
</script>

<style scoped lang="less" style="text/less">
.nav-wrap {
  background: #fff;
  border-bottom: 1px solid #ccc;
  overflow: hidden;
  overflow-x: auto;
  width: 100%;
  min-height: 30px;
  z-index: 999;
  display: flex;
  flex-wrap: nowrap;
  list-style: none;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
  .item {
    padding: 4px 9px;
    flex-shrink: 0;
    &.active {
      color: #ff4800;
    }
  }
}
</style>
