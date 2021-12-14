<template>
  <div id="">
    <ex-tabs :tabList="tabList" v-model="tabIndex">
      <div slot="header" style="height:50px;background:#a8a8a8;position:sticky;top:0">
        fsa
      </div>
      <!-- <div slot="nav">fas</div> -->
      <div
        v-for="(item, index) in tabList"
        :slot="index"
        :key="index"
        :style="`background: #${index + 5}${index + 5}${index + 5}`"
      >
        <div>
          <p v-for="n in item.count" :key="n">{{ n }} -------------------------- page{{ index }}</p>
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
      tabList: [
        {
          label: '财经',
          code: 'CJ',
          count: 500,
        },
        {
          label: '科技2',
          code: 'KJ',
          count: 600,
        },
        {
          label: '财经3',
          code: 'CJ1',
          count: 70,
        },
        {
          label: '科技4',
          code: 'KJ1',
          count: 90,
        },
        {
          label: '财经5',
          code: 'CJ2',
          count: 50,
        },
        {
          label: '科技6',
          code: 'KJ2',
          count: 90,
        },
        {
          label: '财经7',
          code: 'CJ3',
          count: 70,
        },
        {
          label: '科技8',
          code: 'KJ3',
          count: 60,
        },
        {
          label: '财经9',
          code: 'CJ4',
          count: 90,
        },
        {
          label: '科技10',
          code: 'KJ4',
          count: 90,
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

<style scoped lang="less" style="text/less">
p {
  margin: 0;
}
</style>
