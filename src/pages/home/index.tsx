/**
 * 首页
 * 
 * sobird<i@sobird.me> at 2023/09/13 17:24:00 created.
 */

import React from "react";
import { useSelector } from 'react-redux';

const Home: React.FC = () => {
  const st = useSelector(state => state);
  console.log('st', st)
  return (
    <div>1</div>
  )
}

export default Home;
