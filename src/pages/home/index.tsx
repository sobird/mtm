/**
 * 首页
 * 
 * sobird<i@sobird.me> at 2023/09/13 17:24:00 created.
 */

import React, { useEffect } from "react";
import { useSelector } from 'react-redux';

const Home: React.FC = () => {
  const st = useSelector(state => state.app);
  useEffect(() => {
    // 
  }, [])
  return (
    <div>home</div>
  )
}

export default Home;
