const states = new WeakMap();

export function createState(value) {
  const symbol = Symbol();
  states.set(symbol, {
    value,
    dependents: new Set(),
  });
  return symbol;
}

function getStateBySymbol(symbol) {
  const state = states.get(symbol);
  if (!state) {
    throw new Error(`No state found for symbol: ${String(symbol)}`);
  }
  return state;
}

export function getState(symbol) {
  return getStateBySymbol(symbol).value;
}

export function setState(symbol, value) {
  const state = getStateBySymbol(symbol);
  state.value = value;
  state.dependents.forEach((dependent) => dependent());
  return state.value;
}

export function createEffect(callback, symbols = []) {
  if (typeof callback !== "function") {
    throw new Error(`'callback' must be a function.`);
  }
  if (!Array.isArray(symbols)) {
    throw new Error(`'symbols' must be an array.`);
  }
  if (!symbols.length) {
    callback();
    return () => {};
  }
  const dependent = () => callback(...symbols.map(getState));
  symbols.forEach((symbol) => {
    const state = getStateBySymbol(symbol);
    if (!state.dependents.has(dependent)) {
      state.dependents.add(dependent);
    }
  });
  return () => {
    symbols.forEach((symbol) => {
      const state = getStateBySymbol(symbol);
      state.dependents.delete(dependent);
    });
  };
}

export function createGuardedEffect(callback, condition, symbols = []) {
  if (typeof condition !== "function") {
    throw new Error(`'condition' must be a function.`);
  }
  let prevState;
  return createEffect(() => {
    const currentState = symbols.map(getState);
    if (condition(...currentState)) {
      if (prevState !== currentState) {
        callback(...currentState);
      }
    }
    prevState = currentState;
  }, symbols);
}

const dispatchChildrenUnmountEvents = (element) => {
  element.addEventListener("unmount", () => {
    element.childNodes.forEach((child) => {
      dispatchUnmountEvent(child);
    });
  });
  return element;
};

export const createElement = (type, ...modifiers) =>
  modifiers.reduce(
    (element, modifier) => modifier(element),
    dispatchChildrenUnmountEvents(document.createElement(type))
  );

export const createSvgElement = (type, ...modifiers) =>
  modifiers.reduce(
    (element, modifier) => modifier(element),
    document.createElementNS("http://www.w3.org/2000/svg", type)
  );

export const createText = (text, symbols) => {
  if (symbols) {
    if (typeof text !== "function") {
      throw new Error(`'text' must be a function when 'symbols' are provided.`);
    }
    const node = document.createTextNode(text());

    symbols.forEach((symbol) => {
      const { dependents } = getStateBySymbol(symbol);
      const dependent = () => {
        const text_ = text();
        if (node.nodeValue !== text_) {
          node.nodeValue = text_;
        }
      };

      dependents.add(dependent);

      node.addEventListener("unmount", () => dependents.delete(dependent), {
        once: true,
      });
    });

    return node;
  } else {
    if (typeof text === "function") {
      throw new Error("'symbols' must be provided when 'text' is a function.");
    }
    return document.createTextNode(text);
  }
};

export const createRef = (callback) => (element) => {
  const ref = new WeakRef(element);
  callback(ref);
  return element;
};

export const setProperty = (key, value, symbols) => (element) => {
  if (symbols) {
    if (typeof value !== "function") {
      throw new Error(
        `'value' must be a function when 'symbols' are provided.`
      );
    }
    element[key] = value();
    symbols.forEach((symbol) => {
      const { dependents } = getStateBySymbol(symbol);
      const dependent = () => {
        const value_ = value();
        if (element[key] !== value_) {
          element[key] = value_;
        }
      };

      dependents.add(dependent);

      element.addEventListener("unmount", () => dependents.delete(dependent), {
        once: true,
      });
    });
  } else {
    if (typeof value === "function") {
      throw new Error(`'symbols' must be provided when 'value' is a function.`);
    }
    element[key] = value;
  }
  return element;
};

export const setAttribute = (key, value, symbols) => (element) => {
  if (symbols) {
    if (typeof value !== "function") {
      throw new Error(
        `'value' must be a function when 'symbols' are provided.`
      );
    }
    element.setAttribute(key, value());
    symbols.forEach((symbol) => {
      const { dependents } = getStateBySymbol(symbol);
      const dependent = () => {
        const value_ = value();
        if (element.getAttribute(key) !== value_) {
          element.setAttribute(key, value_);
        }
      };

      dependents.add(dependent);

      element.addEventListener("unmount", () => dependents.delete(dependent), {
        once: true,
      });
    });
  } else {
    if (typeof value === "function") {
      throw new Error(`'symbols' must be provided when 'value' is a function.`);
    }
    element.setAttribute(key, value);
  }
  return element;
};

export const addEventListener = (type, listener) => (element) => {
  element.addEventListener(type, listener);
  element.addEventListener(
    "unmount",
    () => element.removeEventListener(type, listener),
    { once: true }
  );
  return element;
};

function dispatchUnmountEvent(element) {
  const event = new CustomEvent("unmount");
  element.dispatchEvent(event);
}

export const onMount = (callback) => (element) => {
  element.addEventListener("mount", callback, { once: true });
  callback();
  return element;
};

export const onUnmount = (callback) => (element) => {
  element.addEventListener("unmount", callback, { once: true });
  return element;
};

export const addChild = (child, symbols) => (element) => {
  if (symbols) {
    if (typeof child !== "function") {
      throw new Error(
        `'child' must be a function when 'symbols' are provided.`
      );
    }
    let child_ = child();
    element.appendChild(child_);

    symbols.forEach((symbol) => {
      const { dependents } = getStateBySymbol(symbol);
      let prevChild = child_;

      const dependent = () => {
        const newChild = child();
        if (!newChild.isEqualNode(prevChild)) {
          element.replaceChild(newChild, prevChild);
          prevChild = newChild;
        }
      };

      dependents.add(dependent);

      element.addEventListener(
        "unmount",
        () => {
          dependents.delete(dependent);
        },
        { once: true }
      );
    });
  } else {
    if (typeof child === "function") {
      throw new Error("'symbols' must be provided when 'child' is a function.");
    }
    element.appendChild(child);
  }
  return element;
};

export const addGuardedChild = (child, condition, symbols) => (element) => {
  if (typeof child !== "function") {
    throw new Error(`'child' must be a function.`);
  }
  if (typeof condition !== "function") {
    throw new Error(`'condition' must be a function.`);
  }
  if (!Array.isArray(symbols)) {
    throw new Error(`'symbols' must be an array.`);
  }

  let childElement;
  let prevConditionResult;

  const updateChild = () => {
    const currentState = symbols.map(getState);
    const currentConditionResult = condition(...currentState);

    if (currentConditionResult !== prevConditionResult) {
      if (currentConditionResult) {
        if (!childElement) {
          childElement = child();
          element.appendChild(childElement);
        } else {
          const newChild = child();
          if (!newChild.isEqualNode(childElement)) {
            element.replaceChild(newChild, childElement);
            childElement = newChild;
          }
        }
      } else {
        if (childElement) {
          dispatchUnmountEvent(childElement);
          element.removeChild(childElement);
          childElement = null;
        }
      }
    }
    prevConditionResult = currentConditionResult;
  };

  symbols.forEach((symbol) => {
    const { dependents } = getStateBySymbol(symbol);
    dependents.add(updateChild);

    element.addEventListener(
      "unmount",
      () => {
        dependents.delete(updateChild);
      },
      { once: true }
    );
  });

  updateChild();

  return element;
};

export const addKeyedChildren =
  (childKey, createChildFunc, symbols) => (element) => {
    if (typeof childKey !== "symbol") {
      throw new Error(`'childKey' must be a symbol.`);
    }
    if (typeof createChildFunc !== "function") {
      throw new Error(`'createChildFunc' must be a function.`);
    }
    if (!Array.isArray(symbols)) {
      throw new Error(`'symbols' must be an array.`);
    }

    const childrenMap = new Map();
    const startIndex = element.childNodes.length;
    const cache = new WeakMap();

    const memoizedCreateChildFunc = (arg) => {
      if (cache.has(arg)) {
        return cache.get(arg);
      } else {
        const result = createChildFunc(arg);
        cache.set(arg, result);
        return result;
      }
    };

    const updateChildren = () => {
      const children = getState(childKey).map(memoizedCreateChildFunc);
      const newKeys = new Set(children.map(([key]) => key));

      for (let [key, childElement] of childrenMap) {
        if (!newKeys.has(key)) {
          dispatchUnmountEvent(childElement);
          element.removeChild(childElement);
          childrenMap.delete(key);
        }
      }

      let index = startIndex;
      for (let [key, newChild] of children) {
        let childElement = childrenMap.get(key);
        if (!childElement) {
          childElement = newChild;
          element.insertBefore(childElement, element.childNodes[index]);
          childrenMap.set(key, childElement);
        } else {
          if (!newChild.isEqualNode(childElement)) {
            element.replaceChild(newChild, childElement);
            childrenMap.set(key, newChild);
          }
          if (element.childNodes[index] !== childElement) {
            element.insertBefore(childElement, element.childNodes[index]);
          }
        }
        index++;
      }
    };

    symbols.forEach((symbol) => {
      const { dependents } = getStateBySymbol(symbol);
      dependents.add(updateChildren);

      element.addEventListener(
        "unmount",
        () => {
          dependents.delete(updateChildren);
        },
        { once: true }
      );
    });

    updateChildren();

    return element;
  };

export const trace = (label) => (element) => {
  console.log(label, element);
  return element;
};
