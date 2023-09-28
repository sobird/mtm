/**
 * index.tsx
 *
 * sobird<i@sobird.me> at 2023/09/26 18:26:10 created.
 */

import { Button, ConfigProvider, Divider, Dropdown, Input, Popover, theme } from 'antd';
import {
  CaretDownFilled,
  DoubleRightOutlined,
  GithubFilled,
  InfoCircleFilled,
  LogoutOutlined,
  PlusCircleFilled,
  QuestionCircleFilled,
  SearchOutlined,
} from '@ant-design/icons';

const SearchInput = () => {
  const { token } = theme.useToken();
  return (
    <div
      key='SearchOutlined'
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        marginInlineEnd: 24,
      }}
      onMouseDown={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Input
        style={{
          borderRadius: 4,
          marginInlineEnd: 12,
          backgroundColor: token.colorBgTextHover,
        }}
        prefix={
          <SearchOutlined
            style={{
              color: token.colorTextLightSolid,
            }}
          />
        }
        placeholder='搜索'
        bordered={false}
      />
      <PlusCircleFilled
        style={{
          color: token.colorPrimary,
          fontSize: 24,
        }}
      />
    </div>
  );
};

export default SearchInput;
