import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Antd from 'antd';

import { Page } from '@mtm/shared';
// import Mdx from './mdx.tsx';
import Mdx from '@/components/mdx';

import defaultMdxText from '!raw-loader!./index.mdx';

export default function MdxTest() {
  const [value, setValue] = useState();

  const onChange = async value => {
    setValue(value);
  };

  return (
    <Page
      title='Mdx Playground'
      description='mdx 测试'
      bodyStyle={{
        flexDirection: 'row',
        gap: 15,
      }}
    >

      <Editor
        theme='vs-dark'
        height='70vh'
        width='60%'
        defaultLanguage='mdx'
        onChange={onChange}
        defaultValue={defaultMdxText as unknown as string}
      />

      <div className='mdx-playground' style={{ width: '40%' }}>
        <Mdx value={value || defaultMdxText as unknown as string} components={{
          ...Antd
        }} />
      </div>
    </Page>
  );
}
