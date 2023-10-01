/**
 * 全局搜索组件
 * 
 * sobird<i@sobird.me> at 2023/09/12 15:14:52 created.
 */

import React from "react";
import { Input, Popover } from 'antd';
import './index.scss';

const content = (
  <div style={{width: '300px'}}>
    <p>Content</p>
    <p>Content</p>
  </div>
);

const Search: React.FC = () => {
  return (
    <div className="app-search">
      <Popover content={content} trigger="click" title="Title" arrow={false}>
        <Input.Search
          placeholder="搜索你感兴趣的内容"
          allowClear
          enterButton="搜索"
          size="middle"
          width="50%"
        />
      </Popover>
    </div>
  )
}

export default Search;
