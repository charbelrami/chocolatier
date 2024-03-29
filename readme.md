# chocolatier

## Table of Contents

- [chocolatier](#chocolatier)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Pipe Operator](#pipe-operator)
  - [Installation](#installation)
    - [npm](#npm)
    - [CDN](#cdn)
  - [Introduction](#introduction)
  - [State Management](#state-management)
    - [createState](#createstate)
    - [getState](#getstate)
    - [setState](#setstate)
  - [Effects](#effects)
    - [createEffect](#createeffect)
    - [createGuardedEffect](#createguardedeffect)
  - [DOM Element Creation and Manipulation](#dom-element-creation-and-manipulation)
    - [createElement](#createelement)
    - [createSvgElement](#createsvgelement)
    - [createText](#createtext)
    - [createRef](#createref)
    - [setProperty](#setproperty)
    - [setAttribute](#setattribute)
    - [addEventListener](#addeventlistener)
    - [addChild](#addchild)
    - [addGuardedChild](#addguardedchild)
    - [addKeyedChildren](#addkeyedchildren)
    - [onMount](#onmount)
    - [onUnmount](#onunmount)
  - [Styling](#styling)
    - [CSS class](#css-class)
    - [Tailwind CSS](#tailwind-css)
  - [Composing UI](#composing-ui)
  - [Examples](#examples)

## Overview

```js
const helloWorld = createElement("p", addChild(createText("Hello, world!")));
```

```js
const count = createState(0);

const counter = createElement(
  "button",
  addEventListener("click", () => setState(count, getState(count) + 1)),
  addChild(createText(() => getState(count), [count]))
);
```

[See counter on CodeSandbox](https://codesandbox.io/s/chocolatier-counter-izr5q9?file=/src/index.js)

### Pipe Operator

```js
const count = createState(0);

const counter =
  createElement("button")
  |> addEventListener("click", () => setState(count, getState(count) + 1))(%)
  |> addChild(createText(() => getState(count), [count]))(%);
```

[See pipe operator on CodeSandbox](https://codesandbox.io/s/chocolatier-pipeline-operator-b1ilio?file=/src/index.js)

## Installation

### npm

```sh
npm install chocolatier
```

### CDN

```html
<script src="https://unpkg.com/chocolatier/dist/index.umd.js"></script>
```

## Introduction

**chocolatier** is a lightweight, reactive JavaScript library for pragmatic state management and effective DOM manipulation. It uses a powerful combination of Symbols, WeakMaps, and Sets to offer precise control over even the most granular aspects of the DOM. It also handles dependencies and side effects in a transparent and predictable manner, improving code readability and maintainability.

chocolatier offers a refreshing level of predictability by not adopting the "component" concept in a traditional sense, as seen in component-based frameworks. Instead, it allows for the composition of UI by assigning DOM elements to variables, and using plain functions that return DOM elements. This avoids unexpected re-renders, function calls, or side effects that are common pitfalls in other libraries.
Additionally, defining states and effects is not restricted to components. For a practical example of UI composition using chocolatier, refer to [Composing UI](#composing-ui).

Another noteworthy feature of chocolatier is that state updates are synchronous. This ensures that they happen immediately and in the order they are called, mitigating the risk of state inconsistency.

Unlike many modern libraries that require transpiling and bundling processes, chocolatier is written in plain JavaScript and can be included directly in a web page using a script tag. For TypeScript users, types are provided out of the box through [JSDoc comments](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html).

Here's how chocolatier works:

## State Management

### createState

`createState(value)` creates a new state with the given initial value. It returns a unique symbol as the key for this state.

```js
const count = createState(0);
```

### getState

`getState(symbol)` retrieves the current value of the state identified by the given symbol.

```js
console.log(getState(count)); // 0
```

### setState

`setState(symbol, value)` sets the value of the state identified by the given symbol and invokes all the dependent effects. `setState` is synchronous.

```js
setState(count, getState(count) + 1);
```

## Effects

### createEffect

`createEffect(callback, symbols)` creates a new effect with the given callback function and an array of state symbols that this effect depends on. The callback function is invoked whenever any of the dependent states change. The callback function is invoked immediately if no state symbols are provided.

```js
createEffect(() => {
  console.log(getState(count));
}, [count]);
```

### createGuardedEffect

`createGuardedEffect(callback, condition, symbols)` creates a new guarded effect. This effect only triggers its callback function when its condition function returns true.

```js
createGuardedEffect(
  () => {
    console.log(getState(count));
  },
  () => getState(count) > 0,
  [count]
);
```

## DOM Element Creation and Manipulation

### createElement

`createElement(elementType, ...modifiers)` creates a new HTML element of the given type and applies the provided modifiers to it.

```js
createElement(
  "button",
  addEventListener("click", () => setState(count, getState(count) + 1)),
  addChild(createText("Increment"))
);
```

### createSvgElement

`createSvgElement(elementType, ...modifiers)` creates a new SVG element of the given type and applies the provided modifiers to it.

### createText

`createText(text, symbols)` creates a new text node with the given text, which can be a static string, a static number, a function that returns a number, or a function that returns a string. When the text is a function, symbols should be provided to track the dependent states. The text node is updated whenever any of the dependent states change.

```js
createElement("p", addChild(createText("Hello, world!")));
```

```js
createElement(
  "button",
  addEventListener("click", () => setState(count, getState(count) + 1)),
  addChild(createText(() => getState(count), [count]))
);
```

### createRef

`createRef(callback)` creates a new reference to a DOM element and invokes the provided callback function with this reference.

```js
createElement(
  "p",
  createRef((ref) => console.log(ref.deref())),
  addChild(createText("Hello, world!"))
);
```

### setProperty

`setProperty(key, value, symbols)` sets the property of a DOM element to the given value. The value can be a static value or a function that returns a value. When the value is a function, symbols should be provided to track the dependent states. The value of the property is updated whenever any of the dependent states change.

```js
createElement("input", setProperty("id", "name"));
```

```js
createElement(
  "button",
  addEventListener("click", () => setState(count, getState(count) - 1)),
  setProperty("disabled", () => getState(count) <= 0, [count]),
  addChild(createText("Decrement"))
);
```

### setAttribute

`setAttribute(key, value, symbols)` sets the attribute of a DOM element to the given value. The value can be a static value or a function that returns a value. When the value is a function, symbols should be provided to track the dependent states. The value of the attribute is updated whenever any of the dependent states change.

```js
createElement(
  "label",
  setAttribute("for", "name"),
  addChild(createText("Name"))
);
```

### addEventListener

`addEventListener(eventType, listener, options)` adds an event listener to a DOM element.

```js
createElement(
  "button",
  addEventListener("click", () => setState(count, getState(count) + 1)),
  addChild(createText("Increment"))
);
```

### addChild

`addChild(child, symbols)` adds a child to a DOM element. The child can be a static node or a function that returns a node. When the child is a function, symbols should be provided to track the dependent states. The child is updated whenever any of the dependent states change.

```js
createElement("p", addChild(createText("Hello, world!")));
```

### addGuardedChild

`addGuardedChild(child, condition, symbols)` conditionally adds a child to a DOM element. The child must be a function that returns a node. Symbols must be provided to track the dependent states. When the condition function returns true, the child is added to the DOM element. When the condition function returns false, the child is removed from the DOM element.

```js
createElement(
  "p",
  addGuardedChild(
    () => createText("Count is greater than or equal to 10"),
    () => getState(count) >= 10,
    [count]
  )
);
```

### addKeyedChildren

`addKeyedChildren(createItem, getKey, symbol)` adds a list of children to a DOM element, where each child is identified by a unique key.

```js
const list = createState([
  { id: "foo", text: "Foo" },
  { id: "bar", text: "Bar" },
  { id: "baz", text: "Baz" },
]);

createElement(
  "ul",
  addKeyedChildren(
    (item) => createElement("li", addChild(createText(item.text))),
    (item) => item.id,
    list
  )
);
```

### onMount

`onMount(callback)` adds a 'mount' event listener to a DOM element.

```js
createElement(
  "p",
  onMount(() => console.log("mounted")),
  addChild(createText("Hello, world!"))
);
```

### onUnmount

`onUnmount(callback)` adds an 'unmount' event listener to a DOM element.

```js
createElement(
  "p",
  onUnmount(() => console.log("unmounted")),
  addChild(createText("Hello, world!"))
);
```

## Styling

### CSS class

```css
.btn {
  border-radius: 0.25rem;
  border-style: none;
  padding: 0.5rem 1rem;
}
```

```js
createElement(
  "button",
  setAttribute("class", "btn"),
  addChild(createText("Button"))
);
```

### Tailwind CSS

```js
createElement(
  "button",
  setAttribute(
    "class",
    "rounded border-none bg-indigo-700 px-4 py-2 font-sans text-white"
  ),
  addChild(createText("Button"))
);
```

## Composing UI

```js
const users = createState([]);
const selectedUserId = createState();
const posts = createState([]);
const selectedPostId = createState();
const comments = createState([]);

createEffect(() => {
  fetch("https://jsonplaceholder.typicode.com/users")
    .then((response) => response.json())
    .then((data) => setState(users, data));
});

createGuardedEffect(
  () => {
    setState(posts, []);
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

createGuardedEffect(
  () => {
    setState(comments, []);
    fetch(
      `https://jsonplaceholder.typicode.com/posts/${getState(
        selectedPostId
      )}/comments`
    )
      .then((response) => response.json())
      .then((data) => setState(comments, data));
  },
  () => getState(selectedPostId) !== undefined,
  [selectedPostId]
);

const selectLabel = createElement(
  "label",
  setAttribute("for", "users"),
  addChild(createText("Select a user"))
);

const selectOption = (user) =>
  createElement(
    "option",
    setProperty("value", user.id),
    addChild(createText(user.name))
  );

const selectInput = createElement(
  "select",
  setProperty("id", "users"),
  setProperty("value", () => getState(selectedUserId), [selectedUserId]),
  addEventListener("change", (e) => setState(selectedUserId, e.target.value)),
  addKeyedChildren(
    (user) => selectOption(user),
    (user) => user.id,
    users
  )
);

const viewCommentButton = (post) =>
  createElement(
    "button",
    addEventListener("click", () => setState(selectedPostId, post.id)),
    addChild(createText("View comments"))
  );

const commentItem = (comment) =>
  createElement("li", addChild(createText(comment.body)));

const commentList = addKeyedChildren(
  (comment) => commentItem(comment),
  (comment) => comment.id,
  comments
);

const postItem = (post) =>
  createElement(
    "li",
    addChild(createText(post.title)),
    addChild(viewCommentButton(post)),
    addGuardedChild(
      () =>
        createElement(
          "section",
          addChild(createElement("h3", addChild(createText("Comments")))),
          commentList
        ),
      () =>
        getState(comments).length > 0 && getState(selectedPostId) === post.id,
      [comments, selectedPostId]
    )
  );

const postList = createElement(
  "ul",
  addKeyedChildren(
    (post) => postItem(post),
    (post) => post.id,
    posts
  )
);

const userPosts = createElement(
  "section",
  addChild(createElement("h2", addChild(createText("User Posts")))),
  addChild(selectLabel),
  addChild(selectInput),
  addGuardedChild(
    () => postList,
    () => getState(posts).length > 0,
    [posts]
  )
);

const root = document.getElementById("root");
root.appendChild(userPosts);
```

[See Composing UI on CodeSandbox](https://codesandbox.io/s/chocolatier-ui-composition-iubtmc?file=/src/index.js)

## Examples

- [See counter on CodeSandbox](https://codesandbox.io/s/chocolatier-counter-izr5q9?file=/src/index.js)
- [See pipe operator on CodeSandbox](https://codesandbox.io/s/chocolatier-pipeline-operator-b1ilio?file=/src/index.js)
- [See range on CodeSandbox](https://codesandbox.io/s/chocolatier-range-hwii4h?file=/src/index.js)
- [See user posts on CodeSandbox](https://codesandbox.io/s/chocolatier-user-posts-s6qypi?file=/src/index.js)
- [See element lifecycle on CodeSandbox](https://codesandbox.io/s/chocolatier-lifecycle-y61qig?file=/src/index.js)
- [See Composing UI on CodeSandbox](https://codesandbox.io/s/chocolatier-ui-composition-iubtmc?file=/src/index.js)
