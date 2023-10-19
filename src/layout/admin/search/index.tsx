/**
 * 全局搜索组件
 *
 * sobird<i@sobird.me> at 2023/09/12 15:14:52 created.
 */

import React, {useState, useCallback} from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './index.scss';
import debounce from 'lodash/debounce'
import useLocalStorageState from '@/hooks/useLocalStorageState';

const content = (
  <div style={{ width: '300px' }}>
    <p>Content</p>
    <p>Content</p>
  </div>
);

const Search: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [his, setHis] = useLocalStorageState('mtm_history', []);

  const debounceFn= useCallback(
    debounce((value) => {
      setKeyword(value);
      setHis(value);
    }, 200),
    []
  );


  return (
    <div className='app-search'>
      <Select
        showSearch
        placeholder='搜索你感兴趣的内容'
        allowClear
        size='middle'
        style={{
          width: '50%',
          maxWidth: '580px'
        }}
        suffixIcon={<SearchOutlined />}
        dropdownRender={() => {
          return <div>dropdownRender</div>
        }}

        onSearch={debounceFn}
      />
    </div>
  );
};

export default Search;
