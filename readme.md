# chocolatier

## Introduction

**chocolatier** is a lightweight (less than 2kB), reactive JavaScript library for intuitive state management and effective DOM manipulation. It uses a powerful combination of Symbols, WeakMaps, and Sets to offer precise control over even the most granular aspects of the DOM. It also handles dependencies and side effects in a transparent and predictable manner, improving code readability and maintainability.

chocolatier offers a refreshing level of predictability by not adopting the "component" concept in a traditional sense as seen in component-based frameworks. Instead, it allows for the composition of UI using simple functions that return DOM elements. This avoids unexpected re-renders, function calls, or side effects that are common pitfalls in other libraries.

With chocolatier, states and effects are not restricted to components; they can be defined anywhere in your code. This offers flexibility in sharing states and effects, and makes it easy to reason about the state of the DOM at any given moment.

A standout feature of chocolatier is that `setState` operates synchronously. This ensures that updates to the state happen immediately and in the order they are called, eliminating the risk of state inconsistency.

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
  "p",
  addChild(
    createElement(
      "label",
      setAttribute("for", "name"),
      addChild(createText("Name"))
    )
  ),
  addChild(createElement("input", setProperty("id", "name")))
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

`addKeyedChildren(symbol, generateKeyNodePair, symbols)` adds a list of children to a DOM element, where each child is identified by a unique key. Symbols must be provided to track the dependent states. The children are updated whenever any of the dependent states change.

```js
const list = createState([
  { id: "foo", text: "Foo" },
  { id: "bar", text: "Bar" },
  { id: "baz", text: "Baz" },
]);

createElement(
  "ul",
  addKeyedChildren(
    list,
    (item) => [item.id, createElement("li", addChild(createText(item.text)))],
    [list]
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

## Examples

[CodeSandbox](https://codesandbox.io/s/chocolatier-examples-1fgdh2?file=/src/index.js)
