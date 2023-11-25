import { useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as Antd from 'antd';
import { Page, ErrorBoundary } from '@mtm/shared';
import defaultMdxText from '!raw-loader!./index.mdx';
import Mdx from '@/components/mdx';

const monacoConfig = {
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs',
  },
};

loader.config(monacoConfig);

export default function MdxTest() {
  const [value, setValue] = useState();

  const onChange = async (editorValue) => {
    setValue(editorValue);
  };

  return (
    <Page
      title="Mdx Playground"
      description="mdx 测试"
      bodyStyle={{
        flexDirection: 'row',
        gap: 15,
      }}
    >

      <Editor
        theme="vs-dark"
        height="70vh"
        width="60%"
        defaultLanguage="mdx"
        onChange={onChange}
        defaultValue={defaultMdxText as unknown as string}
      />

      <div className="mdx-playground" style={{ width: '40%' }}>
        <ErrorBoundary onRetry={() => { /**  */ }}>
          <Mdx
            value={value || defaultMdxText as unknown as string}
            components={{
              ...Antd,
            }}
          />
        </ErrorBoundary>
      </div>
    </Page>
  );
}
