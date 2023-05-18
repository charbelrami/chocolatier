import {
  addChild,
  addEventListener,
  addGuardedChild,
  addKeyedChildren,
  createEffect,
  createElement,
  createGuardedEffect,
  createRef,
  createState,
  createText,
  getState,
  onMount,
  onUnmount,
  setAttribute,
  setProperty,
  setState,
} from "../src";

const count = createState(0);

const counter = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("Counter")))),
  addChild(
    createElement(
      "button",
      addEventListener("click", () => setState(count, getState(count) + 1)),
      addChild(createText(() => getState(count), [count]))
    )
  )
);

const rangeState = createState(0);

const range = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("Range")))),
  addChild(
    createElement(
      "label",
      setAttribute("for", "range-id"),
      addChild(createText("Range"))
    )
  ),
  addChild(
    createElement(
      "input",
      setProperty("id", "range-id"),
      setProperty("type", "range"),
      setProperty("value", () => getState(rangeState), [rangeState]),
      addEventListener("input", (e) =>
        setState(rangeState, e.target.valueAsNumber)
      )
    )
  ),
  addChild(
    createElement(
      "output",
      setAttribute("for", "range-id"),
      addChild(createText(() => getState(rangeState), [rangeState]))
    )
  )
);

const users = createState([]);
const selectedUserId = createState();
const posts = createState([]);

createEffect(() => {
  fetch("https://jsonplaceholder.typicode.com/users")
    .then((response) => response.json())
    .then((data) => setState(users, data));
});

createGuardedEffect(
  () => {
    fetch(
      `https://jsonplaceholder.typicode.com/users/${getState(
        selectedUserId
      )}/posts`
    )
      .then((response) => response.json())
      .then((data) => setState(posts, data));
  },
  () => getState(selectedUserId) !== undefined,
  [selectedUserId]
);

const userPosts = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("User Posts")))),
  addChild(
    createElement(
      "label",
      setAttribute("for", "users"),
      addChild(createText("Select a user"))
    )
  ),
  addChild(
    createElement(
      "select",
      setProperty("id", "users"),
      setProperty("value", () => getState(selectedUserId), [selectedUserId]),
      addEventListener("change", (e) =>
        setState(selectedUserId, e.target.value)
      ),
      addKeyedChildren(
        users,
        (user) => [
          user.id,
          createElement(
            "option",
            setProperty("value", user.id),
            addChild(createText(user.name))
          ),
        ],
        [users]
      )
    )
  ),
  addGuardedChild(
    () =>
      createElement(
        "ul",
        addKeyedChildren(
          posts,
          (post) => [
            post.id,
            createElement("li", addChild(createText(post.title))),
          ],
          [posts]
        )
      ),
    () => getState(posts).length > 0,
    [posts]
  )
);

const toggle = createState(false);

const elementLifecycle = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("Element Lifecycle")))),
  addChild(
    createElement(
      "input",
      setProperty("type", "checkbox"),
      setProperty("id", "toggle"),
      setProperty("checked", () => getState(toggle), [toggle]),
      addEventListener("change", () => setState(toggle, !getState(toggle)))
    )
  ),
  addChild(
    createElement(
      "label",
      setProperty("htmlFor", "toggle"),
      addChild(createText("Toggle element"))
    )
  ),
  addGuardedChild(
    () =>
      createElement(
        "p",
        createRef((ref) => console.log(ref.deref())),
        onMount(() => console.log("mounted")),
        onUnmount(() => console.log("unmounted")),
        addChild(createText("Hello, world!"))
      ),
    () => getState(toggle),
    [toggle]
  )
);

const root = document.getElementById("root");
root.appendChild(counter);
root.appendChild(range);
root.appendChild(userPosts);
root.appendChild(elementLifecycle);
