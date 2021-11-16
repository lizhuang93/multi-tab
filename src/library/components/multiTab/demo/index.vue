<template>
  <div id="">
    <div style="height:100px;background:#ccc"></div>
    <!-- <div style="height:50px;background:#a8a8a8;position:sticky;top:0"></div> -->
    <ex-tabs :tabs="tabs" v-model="tabIndex" :tabStickyTop="0">
      <div v-for="(item, index) in tabs" :key="index" :slot="index">
        <div>
          <p v-for="n in 1000" :key="n">page{{ index }} ---- {{ n }}</p>
        </div>
      </div>
    </ex-tabs>
  </div>
</template>

<script>
import Tabs from '../index.vue';
export default {
  components: {
    'ex-tabs': Tabs,
  },
  props: {},
  data() {
    return {
      tabs: [
        {
          label: '财经',
          code: 'CJ',
        },
        {
          label: '科技',
          code: 'KJ',
        },
        {
          label: '财经1',
          code: 'CJ1',
        },
        {
          label: '科技1',
          code: 'KJ1',
        },
        {
          label: '财经2',
          code: 'CJ2',
        },
        {
          label: '科技2',
          code: 'KJ2',
        },
        {
          label: '财经3',
          code: 'CJ3',
        },
        {
          label: '科技3',
          code: 'KJ3',
        },
        {
          label: '财经4',
          code: 'CJ4',
        },
        {
          label: '科技4',
          code: 'KJ4',
        },
      ],
      tabIndex: 0,
    };
  },

  computed: {},

  mounted() {},

  methods: {},
};
</script>

<style scoped lang="less" style="text/less"></style>
