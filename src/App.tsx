import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import PostsAccordion from "./Posts-accordion"

// Дополнительная страница, чтобы работало navigate("/dashboard")
const Dashboard: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h2>Dashboard page</h2>
    <p>Навигация работает 🎉</p>
  </div>
)

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<PostsAccordion />} />

        {/* Страница Dashboard (navigate("/dashboard")) */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
