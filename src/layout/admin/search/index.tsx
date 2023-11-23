/**
 * 全局搜索组件
 *
 * sobird<i@sobird.me> at 2023/09/12 15:14:52 created.
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Select, Tag, Button } from 'antd';
import { SearchOutlined, DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { Empty } from '@mtm/shared';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useAppSelector } from '@/store/hooks';
import { IMenuItem } from '@/services/menu';

import './index.scss';

type ResultItem = {
  name: string;
  path: string;
};

interface SeachDropdownProps {
  keyword: string;
  history: ResultItem[];
  result: ResultItem[];
  onSelected?: (item: ResultItem) => any;
  onTagClose?: (item: ResultItem) => any;
  onClearHistory?: () => any;
}

const SeachDropdown: React.FC<SeachDropdownProps> = ({
  keyword,
  history = [],
  result = [],
  onSelected,
  onTagClose,
  onClearHistory,
}) => {
  if (keyword) {
    return (
      <div className="search-select-dropdown-suggest">
        {result?.length > 0 ? (
          result.map(item => {
            console.log('item', item);
            return (
              <Link
                to={item.path}
                target="_blank"
                className="search-select-dropdown-suggest-item"
                key={item.path}
                onClick={() => { return onSelected?.(item); }}
              >
                {item.name}
              </Link>
            );
          })
        ) : (
          <Empty />
        )}
      </div>
    );
  }

  return (
    <div className="search-select-dropdown-history">
      <div className="search-history-head">
        <span className="search-history-head-title">搜索历史</span>

        <Button icon={<DeleteOutlined />} type="link" onClick={onClearHistory}>
          清除记录
        </Button>
      </div>
      {history?.length > 0 ? (
        history.map(item => {
          return (
            <Tag
              className="search-history-tag"
              color="#EBEBEB"
              closeIcon={<CloseCircleOutlined />}
              closable
              key={item.path}
              onClose={() => { return onTagClose?.(item); }}
            >
              <Link to={item.path} target="_blank" key={item.path}>
                {item.name}
              </Link>
            </Tag>
          );
        })
      ) : (
        <Empty />
      )}
    </div>
  );
};

const find = (data: IMenuItem[], keyword) => {
  if (keyword === '' || data.length === 0) {
    return [];
  }

  const result = [];

  data.map(parent => {
    const parentFound = parent.title.indexOf(keyword) !== -1;

    parent?.children?.map(child => {
      const childFound = child.title.indexOf(keyword) !== -1;

      if (parentFound || childFound) {
        result.push({
          name: `${parent.title}/${child.title}`,
          path: child.url,
        });
      }
    });
  });

  return result;
};

const Search: React.FC = () => {
  const { menuTrees } = useAppSelector(state => { return state.menu; });
  const [keyword, setKeyword] = useState('');
  const [searchHistory, setSearchHistory] = useLocalStorageState('search_history', []);

  const debounceFn = useCallback(
    debounce(value => {
      setKeyword(value);
    }, 200),
    [],
  );

  /**
   * 记录历史
   *
   * @todo
   * 待测试 保证 搜索历史为最新10条记录
   */
  const recordHistory = useCallback(record => {
    const _searchHistory = [...searchHistory];
    const index = _searchHistory.findIndex(item => { return item.path === record.path; });

    // 如果已存在则删除
    if (index !== -1) {
      _searchHistory.splice(index, 1);
    }

    if (_searchHistory.length >= 10) {
      _searchHistory.pop();
    }

    _searchHistory.unshift(record);

    setSearchHistory([..._searchHistory]);
  }, [searchHistory]);

  const result = find(menuTrees, keyword);

  return (
    <div className="app-search">
      <Select
        popupClassName="search-select-dropdown"
        showSearch
        placeholder="搜索你感兴趣的内容"
        allowClear
        size="middle"
        style={{
          width: '50%',
          maxWidth: '580px',
        }}
        suffixIcon={<SearchOutlined />}
        dropdownRender={() => {
          return (
            <SeachDropdown
              keyword={keyword}
              history={searchHistory}
              result={result}
              onSelected={recordHistory}
              onTagClose={item => {
                const _searchHistory = [...searchHistory];
                const index = _searchHistory.findIndex(record => { return record.path === item.path; });

                if (index !== -1) {
                  _searchHistory.splice(index, 1);
                }

                setSearchHistory(_searchHistory);
              }}
              onClearHistory={() => {
                console.log('onClearHistory', 123);
                setSearchHistory([]);
              }}
            />
          );
        }}
        onSearch={debounceFn}
      />
    </div>
  );
};

export default Search;
