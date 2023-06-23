import { dequal } from "dequal";

/**
 * The objective here is to find an optimal sequence of operations
 * (insert, update, move, remove) to transform the old array into the new
 * one.
 *
 * The LIS is used to find the largest subset of items in the old array
 * that can stay in the same relative order in the new array. This
 * subset of items will not need to be moved, reducing the number of move
 * operations.
 */
function longestIncreasingSubsequence(arr) {
  const seq = [],
    indices = [],
    predecessors = [];

  arr.forEach((value, i) => {
    const pos = binarySearch(seq, value, (a, b) => a - b);

    if (pos >= seq.length) {
      seq.push(value);
    } else {
      seq[pos] = value;
    }

    indices[pos] = i;
    predecessors[i] = pos > 0 ? indices[pos - 1] : undefined;
  });

  let lastIndex = indices[indices.length - 1];
  const result = [];
  while (lastIndex !== undefined) {
    result.unshift(arr[lastIndex]);
    lastIndex = predecessors[lastIndex];
  }
  return result;
}

function binarySearch(arr, target, comparator) {
  let low = 0,
    high = arr.length - 1;

  if (high == -1 || comparator(target, arr[high]) > 0) {
    return high + 1;
  }

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (comparator(arr[mid], target) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function diff(oldArr, newArr, getKey) {
  const oldMap = new Map(
    oldArr.map((item, index) => [getKey(item), { index, item }])
  );
  const newMap = new Map(
    newArr.map((item, index) => [getKey(item), { index, item }])
  );

  const actions = [];
  const existingKeys = new Set(oldMap.keys());

  for (const item of oldArr) {
    if (!newMap.has(getKey(item))) {
      actions.push({ type: "remove", index: oldMap.get(getKey(item)).index });
      existingKeys.delete(getKey(item));
    }
  }

  const oldIndices = Array.from(oldMap.values())
    .filter((val) => existingKeys.has(getKey(val.item)))
    .map((val) => val.index);

  const longestSubsequence = longestIncreasingSubsequence(oldIndices);

  /**
   * While iterating over the new array, if an item was present in the old
   * array and its old index is part of the LIS, it's considered to have
   * been kept in place. If the item is not equal to the old item, an
   * "update" action is added. If the old index is not part of the LIS, a
   * "move" action is added.
   */
  let j = 0;
  for (let i = 0; i < newArr.length; i++) {
    const item = newArr[i];
    const oldItemData = oldMap.get(getKey(item));
    const newIndex = newMap.get(getKey(item)).index;

    if (
      oldItemData !== undefined &&
      oldItemData.index === longestSubsequence[j]
    ) {
      if (!dequal(oldItemData.item, item)) {
        actions.push({ type: "update", index: newIndex, item: item });
      }
      j++;
    } else {
      if (existingKeys.has(getKey(item))) {
        actions.push({
          type: "move",
          from: oldItemData.index,
          to: newIndex,
          item: item,
        });
      } else {
        actions.push({ type: "insert", index: newIndex, item: item });
      }
    }
  }

  return actions;
}

export function applyDiff(
  listNode,
  actions,
  createNode,
  dispatchUnmountEvent,
  startIndex = 0
) {
  const updateActions = actions.filter((action) => action.type === "update");

  const insertActions = actions
    .filter((action) => action.type === "insert")
    .sort((a, b) => a.index - b.index);

  const moveActions = actions
    .filter((action) => action.type === "move")
    .sort((a, b) => a.from - b.from)
    .map(({ from, to }) => {
      const node = listNode.childNodes[from + startIndex];
      return { node, to };
    })
    .sort((a, b) => a.to - b.to);

  const removeActions = actions
    .filter((action) => action.type === "remove")
    .sort((a, b) => b.index - a.index);

  for (const action of updateActions) {
    const node = listNode.childNodes[action.index + startIndex];
    if (node) {
      const newNode = createNode(action.item);
      dispatchUnmountEvent(node);
      listNode.replaceChild(newNode, node);
    }
  }

  for (const action of removeActions) {
    const node = listNode.childNodes[action.index + startIndex];
    if (node) {
      dispatchUnmountEvent(node);
      listNode.removeChild(node);
    }
  }

  for (const action of insertActions) {
    const newNode = createNode(action.item);
    const insertPosition = action.index + startIndex;
    if (insertPosition >= listNode.childNodes.length) {
      listNode.appendChild(newNode);
    } else {
      listNode.insertBefore(newNode, listNode.childNodes[insertPosition]);
    }
  }

  for (const action of moveActions) {
    const moveToPosition = action.to + startIndex;
    if (moveToPosition >= listNode.childNodes.length) {
      listNode.appendChild(action.node);
    } else {
      listNode.insertBefore(action.node, listNode.childNodes[moveToPosition]);
    }
  }
}
