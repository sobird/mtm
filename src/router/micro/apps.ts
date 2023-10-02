/**
 * apps.ts
 * 
 * sobird<i@sobird.me> at 2023/09/25 1:31:55 created.
 */

import { RegistrableApp } from "qiankun";
import store from '@/store';
import { updateMicro } from '@/store/actions/app';

const getActiveRule = (hash: string) => (location) => location.hash.startsWith(hash);

const loader = (loading) => {
  store.dispatch(updateMicro({ loading }));
};

const apps: RegistrableApp<any>[] = [
  {
    name: 'mtm_market',
    entry: process.env.MICRO_MTM_MARKET_HOST,
    container: '#micro-container',
    loader,
    activeRule: getActiveRule('#/market'),
  },
];

export default apps;
