import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Sample from "./sample";
import { useDispatch, useSelector } from "react-redux";
import { IStoreState } from "@/store/reducers";
import * as actionCreator from "@/store/actions/app";

function App() {
  const [count, setCount] = useState(0);
  const { user } = useSelector((state: IStoreState) => state.app);
  const dispatch = useDispatch();

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>用户名：{user.name}</p>
        <button
          onClick={() => {
            dispatch(actionCreator.setUser({ name: "Vite + React" }));
          }}
        >
          设置用户
        </button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <Sample></Sample>
    </>
  );
}

export default App;
