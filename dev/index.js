// @ts-check

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
import "./index.css";

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
        (user) =>
          createElement(
            "option",
            setProperty("value", user.id),
            addChild(createText(user.name))
          ),
        (user) => user.id,
        users
      )
    )
  ),
  addGuardedChild(
    () =>
      createElement(
        "ul",
        addKeyedChildren(
          (post) => createElement("li", addChild(createText(post.title))),
          (post) => post.id,
          posts
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

const cssClassButton = createElement(
  "button",
  setAttribute("class", "btn"),
  addChild(createText("CSS class button"))
);

const tailwindButton = createElement(
  "button",
  setAttribute(
    "class",
    "rounded border-none bg-indigo-700 px-4 py-2 font-sans text-white"
  ),
  addChild(createText("Tailwind button"))
);

const styling = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("Styling")))),
  addChild(cssClassButton),
  addChild(tailwindButton)
);

const generateId = (() => {
  let id = 0;
  return () => String(id++);
})();

const todos = createState([]);
const todo = createState("");

const todoForm = createElement(
  "form",
  addEventListener("submit", (e) => {
    e.preventDefault();
    setState(todos, [
      { id: generateId(), label: getState(todo), completed: false },
      ...getState(todos),
    ]);
  }),
  addChild(
    createElement(
      "input",
      setProperty("value", () => getState(todo), [todo]),
      setAttribute("aria-label", "Todo"),
      addEventListener("input", (e) => setState(todo, e.target.value))
    )
  ),
  addChild(createElement("button", addChild(createText("Add"))))
);

const markAllAsCompleted = createElement(
  "button",
  addChild(createText("Mark all as completed")),
  addEventListener("click", () =>
    setState(
      todos,
      getState(todos).map((t) => ({ ...t, completed: true }))
    )
  )
);

const todoList = createElement(
  "ul",
  addKeyedChildren(
    (todo) =>
      createElement(
        "li",
        addChild(
          createElement(
            "label",
            addChild(
              createElement(
                "input",
                setProperty("checked", todo.completed),
                setProperty("type", "checkbox"),
                addEventListener("change", (e) => {
                  setState(
                    todos,
                    getState(todos).map((t) =>
                      t.id === todo.id
                        ? { ...t, completed: e.target.checked }
                        : t
                    )
                  );
                })
              )
            ),
            addChild(createText(todo.label))
          )
        ),
        addChild(
          createElement(
            "button",
            addChild(createText("Delete")),
            addEventListener("click", () =>
              setState(
                todos,
                getState(todos).filter((t) => t.id !== todo.id)
              )
            )
          )
        )
      ),
    (todo) => todo.id,
    todos
  )
);

const root = document.getElementById("root");
root.appendChild(counter);
root.appendChild(range);
root.appendChild(userPosts);
root.appendChild(elementLifecycle);
root.appendChild(styling);
root.appendChild(todoForm);
root.appendChild(markAllAsCompleted);
root.appendChild(todoList);
