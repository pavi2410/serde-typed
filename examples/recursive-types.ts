import * as t from "../src/index.js";

// Tree structure with recursive types
interface TreeNode {
  value: number;
  name: string;
  children?: TreeNode[];
}

console.log("=== Recursive Tree Structure ===");

// Using lazy for recursive type definitions
const TreeNodeSerde = t.lazy(() =>
  t.object({
    value: t.number,
    name: t.string,
    children: t.optional(t.array(TreeNodeSerde)),
  }),
);

const tree: TreeNode = {
  value: 1,
  name: "root",
  children: [
    {
      value: 2,
      name: "left",
      children: [
        { value: 4, name: "left-left" },
        { value: 5, name: "left-right" },
      ],
    },
    {
      value: 3,
      name: "right",
      children: [{ value: 6, name: "right-left" }],
    },
  ],
};

console.log("Original tree:");
console.log(JSON.stringify(tree, null, 2));

const serialized = TreeNodeSerde.serialize(tree);
console.log("\nSerialized tree:");
console.log(JSON.stringify(serialized, null, 2));

const deserializedResult = TreeNodeSerde.deserialize(serialized);
if (deserializedResult.isOk()) {
  const deserialized = deserializedResult.value;
  console.log("\nDeserialized tree:");
  console.log(JSON.stringify(deserialized, null, 2));

  console.log(
    "\nTrees are equal:",
    JSON.stringify(tree) === JSON.stringify(deserialized),
  );
} else {
  console.error("Deserialization failed:", deserializedResult.error);
}

// Linked list example
interface ListNode {
  value: string;
  next?: ListNode;
}

console.log("\n=== Recursive Linked List ===");

const ListNodeSerde = t.lazy(() =>
  t.object({
    value: t.string,
    next: t.optional(ListNodeSerde),
  }),
);

const linkedList: ListNode = {
  value: "first",
  next: {
    value: "second",
    next: {
      value: "third",
      next: {
        value: "fourth",
      },
    },
  },
};

console.log("Original list:");
console.log(JSON.stringify(linkedList, null, 2));

const serializedList = ListNodeSerde.serialize(linkedList);
const deserializedListResult = ListNodeSerde.deserialize(serializedList);

if (deserializedListResult.isOk()) {
  const deserializedList = deserializedListResult.value;
  console.log("\nDeserialized list:");
  console.log(JSON.stringify(deserializedList, null, 2));

  console.log(
    "\nLists are equal:",
    JSON.stringify(linkedList) === JSON.stringify(deserializedList),
  );
} else {
  console.error("List deserialization failed:", deserializedListResult.error);
}

// Example with error handling
console.log("\n=== Error Handling Example ===");
const invalidData = {
  value: "not a number", // This should be a number
  name: "invalid",
};

const errorResult = TreeNodeSerde.deserialize(invalidData);
if (errorResult.isErr()) {
  console.log("Expected error:", errorResult.error);
}

// Using .unwrap() for throwing behavior when you know it's safe
const validResult = TreeNodeSerde.deserialize(serialized);
try {
  const unwrappedTree = validResult.unwrap();
  console.log("Unwrapped successfully:", unwrappedTree.name);
} catch (error) {
  console.error("This shouldn't happen:", error.message);
}
