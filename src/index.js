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
  children.forEach((child) => {
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
          return element.replaceChildren(text);
        }

        if (Array.isArray(result)) {
          const fragment = document.createDocumentFragment();
          result.forEach((item) => {
            fragment.appendChild(item);
          });
          return element.replaceChildren(fragment);
        }

        element.appendChild(result);
      });
    }

    if (Array.isArray(child)) return render(element, child);

    element.appendChild(child);
  });
}

const supportedSvgTags = ["svg", "path"];

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
        return createReaction(() => element.setAttribute(key, value()));
      return element.setAttribute(key, value);
    });

  render(element, children);

  return element;
}

export function Fragment({ children }) {
  return children;
}
