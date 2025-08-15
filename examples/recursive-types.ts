import type { Serde } from "../src/index.js";
import * as t from "../src/index.js";

// Tree structure with recursive types
interface TreeNode {
  value: number;
  name: string;
  children?: TreeNode[];
}

console.log("=== Recursive Tree Structure ===");

// Using getter pattern for recursive type definitions (similar to Zod)
// This approach provides better type safety than lazy functions
const TreeNodeSerde = t.object({
  value: t.number,
  name: t.string,
  get children() {
    return t.optional(t.array(TreeNodeSerde));
  },
}) as Serde<TreeNode, Record<string, unknown>>;

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

const serializedResult = TreeNodeSerde.serialize(tree);
if (serializedResult.isErr()) {
  console.error("Tree serialization failed:", serializedResult.error);
} else {
  const serialized = serializedResult.value;
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
}

// Linked list example
interface ListNode {
  value: string;
  next?: ListNode;
}

console.log("\n=== Recursive Linked List ===");

// Using getter pattern for self-referential types
const ListNodeSerde = t.object({
  value: t.string,
  get next() {
    return t.optional(ListNodeSerde);
  },
}) as Serde<ListNode, Record<string, unknown>>;

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

const serializedListResult = ListNodeSerde.serialize(linkedList);
if (serializedListResult.isErr()) {
  console.error("List serialization failed:", serializedListResult.error);
} else {
  const serializedList = serializedListResult.value;
  console.log("\nSerialized list:");
  console.log(JSON.stringify(serializedList, null, 2));

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
if (serializedResult.isOk()) {
  const validResult = TreeNodeSerde.deserialize(serializedResult.value);
  try {
    const unwrappedTree = validResult.unwrap();
    console.log("Unwrapped successfully:", unwrappedTree.name);
  } catch (error) {
    console.error("This shouldn't happen:", (error as Error).message);
  }
}

// Demonstrate mutually recursive types (User/Post example)
interface User {
  email: string;
  posts: Post[];
}

interface Post {
  title: string;
  author: User;
}

console.log("\n=== Mutually Recursive Types (User/Post) ===");

const UserSerde = t.object({
  email: t.string,
  get posts() {
    return t.array(PostSerde);
  },
}) as Serde<User, Record<string, unknown>>;

const PostSerde = t.object({
  title: t.string,
  get author() {
    return UserSerde;
  },
}) as Serde<Post, Record<string, unknown>>;

// Note: Be careful with cyclical data - it will cause infinite loops during serialization/deserialization
const simpleUser: User = {
  email: "user@example.com",
  posts: [
    {
      title: "My First Post",
      author: { email: "user@example.com", posts: [] }, // Empty posts to avoid cycle
    },
  ],
};

const userSerializeResult = UserSerde.serialize(simpleUser);
if (userSerializeResult.isOk()) {
  console.log("User serialization successful");
  const userDeserializeResult = UserSerde.deserialize(
    userSerializeResult.value,
  );
  if (userDeserializeResult.isOk()) {
    console.log("User deserialization successful");
    console.log("User:", userDeserializeResult.value.email);
    console.log("Post title:", userDeserializeResult.value.posts[0]?.title);
  }
}
