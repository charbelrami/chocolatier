const reactionMap = new WeakMap();
let reaction;

export function createReaction(fn) {
  reaction = fn;
  reaction();
  reaction = null;
}

export function createState(initialValue) {
  let value = initialValue;
  const getState = () => {
    if (reaction) {
      reactionMap.has(getState)
        ? reactionMap.get(getState).add(reaction)
        : reactionMap.set(getState, new Set([reaction]));
    }
    return value;
  };
  const setState = (newValue) => {
    if (newValue !== value) {
      value = newValue;
      reactionMap.get(getState)?.forEach((reaction) => reaction());
    }
  };
  return [getState, setState];
}

function render(element, children) {
  children.forEach((child, i) => {
    if (child === undefined) return;

    if (["number", "string"].includes(typeof child)) {
      const text = document.createTextNode(child);
      return element.appendChild(text);
    }

    if (typeof child === "function") {
      return createReaction(() => {
        const result = child();

        if (["number", "string"].includes(typeof result)) {
          const text = document.createTextNode(result);
          if (element.childNodes[i]?.nodeType === Node.TEXT_NODE)
            return element.replaceChild(text, element.childNodes[i]);
          return element.appendChild(text);
        }

        if (Array.isArray(result)) {
          const { children } = element;
          for (let i = 0; i < children.length; i++) {
            const prevItem = children[i];
            if (!result.find((node) => node.id === prevItem.id))
              element.removeChild(prevItem);
          }
          for (let i = 0; i < result.length; i++) {
            const prevItem = children[i];
            const item = result[i];
            if (prevItem) {
              if (item.id !== prevItem.id) {
                element.insertBefore(item, prevItem);
                element.removeChild(prevItem);
              }
            } else {
              element.appendChild(item);
            }
          }
          return;
        }

        element.appendChild(result);
      });
    }

    if (Array.isArray(child)) return render(element, child);

    element.appendChild(child);
  });
}

const supportedSvgTags = ["svg", "path"];

function setAttribute(element, key, value) {
  if (key === "value") {
    if (value === true) return (element.value = "");
    return (element.value = value);
  }
  if (value || value === 0) {
    if (value === true) return element.setAttribute(key, "");
    return element.setAttribute(key, value);
  }
  return element.removeAttribute(key);
}

export function h(tag, props, ...children) {
  if (typeof tag === "function") return tag({ ...props, children });

  const element = supportedSvgTags.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag);

  if (props)
    Object.entries(props).forEach(([key, value]) => {
      if (key === "ref") return value(element);
      if (key.startsWith("on"))
        return element.addEventListener(key.slice(2).toLowerCase(), value);
      if (typeof value === "function")
        return createReaction(() => setAttribute(element, key, value()));
      return setAttribute(element, key, value);
    });

  render(element, children);

  return element;
}

export function Fragment({ children }) {
  return children;
}
