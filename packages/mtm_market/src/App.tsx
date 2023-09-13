import React from 'react';
import Campaign from './remotes/campaign';
import Empty from './components/UI/empty';

const App: React.FC = () => {
  return (
    <>
      <Empty></Empty>
      <Campaign />
    </>
  );
}

export default App;
