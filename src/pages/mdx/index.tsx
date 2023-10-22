import React from 'react'
import { Page } from '@mtm/shared';

import Mdx from '@/docs/index.mdx'
import { Playground } from '@/docs/playground';

import AlertSelfSource from '!raw-loader!@/docs/playground';

export default function MdxTest() {
  return (
    <Page title="Mdx 测试场">
      <Mdx />
      <pre>{AlertSelfSource}</pre>
    </Page>
  )
}
