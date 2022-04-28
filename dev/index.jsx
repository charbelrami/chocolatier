import { h, createState } from "../src";

function Counter() {
  const [getCount, setCount] = createState(0);

  return (
    <button onClick={() => setCount(getCount() + 1)}>{() => getCount()}</button>
  );
}

const root = <Counter />;

document.body.appendChild(root);
