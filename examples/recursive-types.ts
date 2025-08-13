import { ObjectSerde, StringSerde, NumberSerde, ArraySerde, Optional, Lazy } from "../src/index.js"

// Tree structure with recursive types
interface TreeNode {
  value: number
  name: string
  children?: TreeNode[]
}

console.log("=== Recursive Tree Structure ===")

// Using Lazy for recursive type definitions
const TreeNodeSerde = Lazy(() => ObjectSerde({
  value: NumberSerde,
  name: StringSerde,
  children: Optional(ArraySerde(TreeNodeSerde))
}))

const tree: TreeNode = {
  value: 1,
  name: "root",
  children: [
    {
      value: 2,
      name: "left",
      children: [
        { value: 4, name: "left-left" },
        { value: 5, name: "left-right" }
      ]
    },
    {
      value: 3,
      name: "right",
      children: [
        { value: 6, name: "right-left" }
      ]
    }
  ]
}

console.log("Original tree:")
console.log(JSON.stringify(tree, null, 2))

const serialized = TreeNodeSerde.serialize(tree)
console.log("\nSerialized tree:")
console.log(JSON.stringify(serialized, null, 2))

const deserialized = TreeNodeSerde.deserialize(serialized)
console.log("\nDeserialized tree:")
console.log(JSON.stringify(deserialized, null, 2))

console.log("\nTrees are equal:", JSON.stringify(tree) === JSON.stringify(deserialized))

// Linked list example
interface ListNode {
  value: string
  next?: ListNode
}

console.log("\n=== Recursive Linked List ===")

const ListNodeSerde = Lazy(() => ObjectSerde({
  value: StringSerde,
  next: Optional(ListNodeSerde)
}))

const linkedList: ListNode = {
  value: "first",
  next: {
    value: "second",
    next: {
      value: "third",
      next: {
        value: "fourth"
      }
    }
  }
}

console.log("Original list:")
console.log(JSON.stringify(linkedList, null, 2))

const serializedList = ListNodeSerde.serialize(linkedList)
const deserializedList = ListNodeSerde.deserialize(serializedList)

console.log("\nDeserialized list:")
console.log(JSON.stringify(deserializedList, null, 2))

console.log("\nLists are equal:", JSON.stringify(linkedList) === JSON.stringify(deserializedList))