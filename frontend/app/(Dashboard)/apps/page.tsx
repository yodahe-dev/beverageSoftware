"use client"

import { useState } from "react"

export default function page() {
    const [count, setCount] = useState(0)
    const handleAdd = () => setCount(count + 1)
    const handleSub = () => setCount(count - 1)


  return (
    <div>
        <h1>{count}</h1>
        <div className="">
        <button className="bg-amber-700"
        onClick={handleAdd}
        >Add</button>
        <button className="bg-green-700"
        onClick={() => setCount(0)}
        >Reset</button>
        <button className="bg-amber-700"
        onClick={handleSub}
        >SUb</button>
        </div>
        </div>
  )
}
