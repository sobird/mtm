import Layout from './layout';

console.log('Layout', Layout);

const createKeyboard = (modelID: number) => {
  const defaultModelID = 23;
  return { type: "keyboard", modelID };
};
// test
export default createKeyboard;