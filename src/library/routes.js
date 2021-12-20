const Nav = () => import(/* webpackChunkName: 'demo' */ './nav');
const MultiTab = () => import(/* webpackChunkName: 'demo' */ './components/multiTab/demo');

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
];

export default routes;
