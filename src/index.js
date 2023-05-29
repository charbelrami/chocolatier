/**
 * @typedef {any} StateValue
 */

/**
 * @typedef {{ value: StateValue, dependents: Set<() => void> }} StateObject
 */

/**
 * @typedef {Symbol} StateSymbol
 */

// const states = new WeakMap(); // https://github.com/tc39/proposal-symbols-as-weakmap-keys

/** @type {Map<StateSymbol, StateObject>} */
const states = new Map();

/**
 *
 * @param {StateValue=} value
 * @returns {StateSymbol}
 */
export function createState(value) {
  const symbol = Symbol();
  states.set(symbol, {
    value,
    dependents: new Set(),
  });
  return symbol;
}

/**
 * @private
 * @param {StateSymbol} symbol
 * @returns {StateObject}
 */
function getStateObjectBySymbol(symbol) {
  const state = states.get(symbol);
  if (!state) {
    throw new Error(`No state found for symbol: ${String(symbol)}`);
  }
  return state;
}

/**
 *
 * @param {StateSymbol} symbol
 * @returns {StateValue}
 */
export function getState(symbol) {
  return getStateObjectBySymbol(symbol).value;
}

/**
 *
 * @param {StateSymbol} symbol
 * @param {StateValue} value
 * @returns {StateValue}
 */
export function setState(symbol, value) {
  const state = getStateObjectBySymbol(symbol);
  state.value = value;
  state.dependents.forEach((dependent) => dependent());
  return state.value;
}

/**
 *
 * @param {(...states: StateValue[]) => void} callback callback
 * @param {StateSymbol[]} [symbols=[]]
 * @returns  {() => void}
 */
export function createEffect(callback, symbols = []) {
  if (!symbols.length) {
    callback();
    return () => {};
  }
  const dependent = () => callback(...symbols.map(getState));
  symbols.forEach((symbol) => {
    const state = getStateObjectBySymbol(symbol);
    if (!state.dependents.has(dependent)) {
      state.dependents.add(dependent);
    }
  });
  return () => {
    symbols.forEach((symbol) => {
      const state = getStateObjectBySymbol(symbol);
      state.dependents.delete(dependent);
    });
  };
}

/**
 *
 * @param {(...states: StateValue[]) => void} callback
 * @param {(...states: StateValue[]) => boolean} condition
 * @param {StateSymbol[]} [symbols=[]]
 * @returns {() => void}
 */
export function createGuardedEffect(callback, condition, symbols = []) {
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

/**
 *
 * @private
 * @param {Element} element
 * @returns {Element}
 */
const dispatchChildrenUnmountEvents = (element) => {
  element.addEventListener("unmount", () => {
    element.childNodes.forEach((child) => {
      // @ts-ignore
      dispatchUnmountEvent(child);
    });
  });
  return element;
};

/**
 *
 * @param {string} elementType
 * @param {...((element: Element) => Element)} modifiers
 * @returns {Element}
 */
export const createElement = (elementType, ...modifiers) =>
  modifiers.reduce(
    (element, modifier) => modifier(element),
    dispatchChildrenUnmountEvents(document.createElement(elementType))
  );

/**
 *
 * @param {string} elementType
 * @param {...((element: SVGElement) => SVGElement)} modifiers
 * @returns {SVGElement}
 */
export const createSvgElement = (elementType, ...modifiers) =>
  modifiers.reduce(
    (element, modifier) => modifier(element),
    document.createElementNS("http://www.w3.org/2000/svg", elementType)
  );

/**
 *
 * @param {string | number | (() => string) | (() => number)} text
 * @param {StateSymbol[]} [symbols]
 * @returns {Text}
 */
export const createText = (text, symbols) => {
  if (symbols) {
    if (typeof text !== "function") {
      throw new Error(
        `'text' must be a function when 'symbols' are provided. Received ${typeof text}.`
      );
    }

    const text_ = text();
    const node = document.createTextNode(
      typeof text_ === "number" ? String(text_) : text_
    );

    symbols.forEach((symbol) => {
      const { dependents } = getStateObjectBySymbol(symbol);
      const dependent = () => {
        const text_ = text();
        if (node.nodeValue !== text_) {
          node.nodeValue = typeof text_ === "number" ? String(text_) : text_;
        }
      };

      dependents.add(dependent);

      node.addEventListener("unmount", () => dependents.delete(dependent), {
        once: true,
      });
    });

    return node;
  } else {
    const text_ = typeof text === "function" ? text() : text;
    return document.createTextNode(
      typeof text_ === "number" ? String(text_) : text_
    );
  }
};

/**
 *
 * @param {(ref: WeakRef<Element>) => void} callback
 * @returns {(element: Element) => Element}
 */
export const createRef = (callback) => (element) => {
  const ref = new WeakRef(element);
  callback(ref);
  return element;
};

/**
 *
 * @param {string} key
 * @param {string | (() => string)} value
 * @param {StateSymbol[]} [symbols]
 * @returns {(element: Element) => Element}
 */
export const setProperty = (key, value, symbols) => (element) => {
  if (symbols) {
    if (typeof value !== "function") {
      throw new Error(
        `'value' must be a function when 'symbols' are provided. Received ${typeof value}.`
      );
    }
    element[key] = value();
    symbols.forEach((symbol) => {
      const { dependents } = getStateObjectBySymbol(symbol);
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
    const value_ = typeof value === "function" ? value() : value;
    element[key] = value_;
  }
  return element;
};

/**
 *
 * @param {string} key
 * @param {string | (() => string)} value
 * @param {StateSymbol[]} [symbols]
 * @returns {(element: Element) => Element}
 */
export const setAttribute = (key, value, symbols) => (element) => {
  if (symbols) {
    if (typeof value !== "function") {
      throw new Error(
        `'value' must be a function when 'symbols' are provided. Received ${typeof value}.`
      );
    }
    element.setAttribute(key, value());
    symbols.forEach((symbol) => {
      const { dependents } = getStateObjectBySymbol(symbol);
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
    const value_ = typeof value === "function" ? value() : value;
    element.setAttribute(key, value_);
  }
  return element;
};

/**
 *
 * @param {string} eventType
 * @param {(event: Event) => void} listener
 * @param {boolean | AddEventListenerOptions} [options]
 * @returns {(element: Element) => Element}
 */
export const addEventListener = (eventType, listener, options) => (element) => {
  element.addEventListener(eventType, listener, options);
  element.addEventListener(
    "unmount",
    () => element.removeEventListener(eventType, listener),
    { once: true }
  );
  return element;
};

/**
 * @private
 * @param {Element} element
 * @returns {void}
 */
function dispatchUnmountEvent(element) {
  const event = new CustomEvent("unmount");
  element.dispatchEvent(event);
}

/**
 *
 * @param {() => void} callback
 * @returns {(element: Element) => Element}
 */
export const onMount = (callback) => (element) => {
  element.addEventListener("mount", callback, { once: true });
  callback();
  return element;
};

/**
 *
 * @param {() => void} callback
 * @returns {(element: Element) => Element}
 */
export const onUnmount = (callback) => (element) => {
  element.addEventListener("unmount", callback, { once: true });
  return element;
};

/**
 *
 * @param {Element | Text | (() => Element) | (() => Text)} child
 * @param {StateSymbol[]} [symbols]
 * @returns {(element: Element) => Element}
 */
export const addChild = (child, symbols) => (element) => {
  if (symbols) {
    if (typeof child !== "function") {
      throw new Error(
        `'child' must be a function when 'symbols' are provided. Received ${typeof child}.`
      );
    }
    let child_ = child();
    element.appendChild(child_);

    symbols.forEach((symbol) => {
      const { dependents } = getStateObjectBySymbol(symbol);
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
    const child_ = typeof child === "function" ? child() : child;
    element.appendChild(child_);
  }
  return element;
};

/**
 *
 * @param {(() => Element)} child
 * @param {(...states: StateValue[]) => boolean} condition
 * @param {StateSymbol[]} symbols
 * @returns
 */
export const addGuardedChild = (child, condition, symbols) => (element) => {
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
          if (element.contains(childElement)) {
            element.removeChild(childElement);
          }
          childElement = null;
        }
      }
    }
    prevConditionResult = currentConditionResult;
  };

  symbols.forEach((symbol) => {
    const { dependents } = getStateObjectBySymbol(symbol);
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

/**
 *
 * @param {StateSymbol} symbol
 * @param {(arg: StateValue) => [string, Element]} generateKeyNodePair
 * @param {StateSymbol[]} symbols
 * @returns {(element: Element) => Element}
 */
export const addKeyedChildren =
  (symbol, generateKeyNodePair, symbols) => (element) => {
    const childrenMap = new Map();
    const startIndex = element.childNodes.length;
    const cache = new WeakMap();

    const memoizedGenerateKeyNodePair = (arg) => {
      if (cache.has(arg)) {
        return cache.get(arg);
      } else {
        const result = generateKeyNodePair(arg);
        cache.set(arg, result);
        return result;
      }
    };

    const updateChildren = () => {
      const children = getState(symbol).map(memoizedGenerateKeyNodePair);
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
      const { dependents } = getStateObjectBySymbol(symbol);
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

/**
 *
 * @param {any} label
 * @returns {(element: Element) => Element}
 */
export const trace = (label) => (element) => {
  console.log(label, element);
  return element;
};
