
export async function aaa() {
  return await new Promise((resolve) => {
    resolve(123);
  })
}

export const map = new Map();

const createKeyboard = (modelID: number) => {
  const defaultModelID = 23;
  return { type: "keyboard", modelID };
};
// test
export default createKeyboard;