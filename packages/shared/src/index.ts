
export async function aaa() {
  return await new Promise((resolve) => {
    resolve(123);
  })
}

const createKeyboard = (modelID: number) => {
  const defaultModelID = 23;
  return { type: "keyboard", modelID };
};
// test
export default createKeyboard;