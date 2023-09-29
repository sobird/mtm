/**
 * apps.ts
 * 
 * sobird<i@sobird.me> at 2023/09/25 1:31:55 created.
 */

import { RegistrableApp } from "qiankun";

const getActiveRule = (hash: string) => (location) => location.hash.startsWith(hash);

const loader = (loading) => {
  console.log('loading', loading)
  if(!loading) {
    // alert(123)
  }
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