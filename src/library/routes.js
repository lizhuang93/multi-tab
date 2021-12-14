const Nav = () => import(/* webpackChunkName: 'demo' */ './nav');
const MultiTab = () => import(/* webpackChunkName: 'demo' */ './components/multiTab/demo');
const MultiTab2 = () => import(/* webpackChunkName: 'demo' */ './components/multiTab2/demo');

const routes = [
  {
    path: '',
    name: 'nav',
    component: Nav,
  },
  {
    path: 'multiTab',
    name: 'multiTab',
    component: MultiTab,
  },
  {
    path: 'multiTab2',
    name: 'multiTab2',
    component: MultiTab2,
  },
];

export default routes;
