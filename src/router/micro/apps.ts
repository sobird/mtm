/**
 * apps.ts
 * 
 * sobird<i@sobird.me> at 2023/09/25 1:31:55 created.
 */

import { RegistrableApp } from "qiankun";

const getActiveRule = (hash: string) => (location) => location.hash.startsWith(hash);

const apps: RegistrableApp<any>[] = [
  {
    name: 'mtm_market',
    entry: process.env.MICRO_MTM_MARKET_HOST,
    container: '#micro-container',
    activeRule: getActiveRule('#/market'),
  },
];

export default apps;
