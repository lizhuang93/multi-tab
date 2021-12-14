<template>
  <div>
    <h1>组件导航</h1>
    <li v-for="(item, index) in list" :key="index">
      <router-link :to="item.path">{{ item.text }}</router-link>
    </li>
  </div>
</template>

<script>
export default {
  name: 'Nav',
  components: {},
  props: {},
  data() {
    return {
      list: [
        {
          path: '/demo/multiTab',
          text: '多Tab多滚动容器',
        },
        {
          path: '/demo/multiTab2',
          text: '多Tab多滚动容器2',
        },
      ],
    };
  },

  computed: {},

  mounted() {},

  methods: {},
};
</script>

<style scoped lang="less" style="text/less"></style>
