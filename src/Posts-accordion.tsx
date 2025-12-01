"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"

// -----------------------------------------------------
// Типы
// -----------------------------------------------------
type Post = {
  userId: number
  id: number
  title: string
  body: string
}

type GroupedPosts = Record<number, Post[]>

// -----------------------------------------------------
// Компонент уведомления с fade-out
// -----------------------------------------------------
const ToastMessage: React.FC<{ message: string; fading: boolean }> = ({ message, fading }) => (
  <div
    style={{
      position: "fixed",
      top: 20,
      right: 20,
      background: "#28a745",
      color: "white",
      padding: "12px 20px",
      borderRadius: 8,
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      zIndex: 9999,
      fontSize: 16,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.7s ease",
    }}
  >
    {message}
  </div>
)

export const PostsAccordion: React.FC = () => {
  // --------------------------------------------
  // Коммит: состояние загрузки, ошибок и данных
  // --------------------------------------------
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --------------------------------------------
  // Метаданные постов
  // --------------------------------------------
  const [likedPosts, setLikedPosts] = useState(new Set<number>())
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set<number>())
  const [lockedPosts, setLockedPosts] = useState(new Set<number>())

  // --------------------------------------------
  // Редактирование / создание
  // --------------------------------------------
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [isNew, setIsNew] = useState(false)

  // --------------------------------------------
  // Аккордионы
  // --------------------------------------------
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set())

  // --------------------------------------------
  // Уведомления с fade-out
  // --------------------------------------------
  const [toast, setToast] = useState("")
  const [fading, setFading] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setFading(false)

    setTimeout(() => setFading(true), 1500)
    setTimeout(() => setToast(""), 2200)
  }

  // --------------------------------------------
  // Загрузка постов
  // --------------------------------------------
  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setLoading(true)

        const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
          signal: controller.signal,
        })

        const data: Post[] = await response.json()
        setPosts(data)
      } catch (err) {
        if (!(err instanceof DOMException)) setError("Ошибка загрузки постов.")
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  // --------------------------------------------
  // Группировка
  // --------------------------------------------
  const groupedPosts = useMemo(() => {
    return posts.reduce((acc, p) => {
      if (!acc[p.userId]) acc[p.userId] = []
      acc[p.userId].push(p)
      return acc
    }, {} as GroupedPosts)
  }, [posts])

  // --------------------------------------------
  // Переключения
  // --------------------------------------------
  const toggleAccordion = (id: number) =>
    setOpenAccordions((prev) => {
      const copy = new Set(prev)
      copy.has(id) ? copy.delete(id) : copy.add(id)
      return copy
    })

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
    setter((prev) => {
      const copy = new Set(prev)
      copy.has(id) ? copy.delete(id) : copy.add(id)
      return copy
    })

  const handleLike = (id: number) => {
    toggleSet(setLikedPosts, id)
    showToast("Лайк обновлён 👍")
  }

  const handleBookmark = (id: number) => {
    toggleSet(setBookmarkedPosts, id)
    showToast("Закладка обновлена 📌")
  }

  const handleLock = (id: number) => {
    toggleSet(setLockedPosts, id)
    showToast("Статус блокировки обновлён 🔒")
  }

  // -----------------------------------------------------
  // Создание поста (POST)
  // -----------------------------------------------------
  const createPost = async () => {
    const newPost = {
      userId: 1,
      title: editedTitle,
      body: editedBody,
    }

    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    })

    const created = await response.json()

    // id отдаётся фейковый — UI обновляем сами
    setPosts((prev) => [{ ...created, id: prev.length + 1000 }, ...prev])

    showToast("Пост успешно создан 🎉")
    closeModal()
  }

  // -----------------------------------------------------
  // Обновление поста (PUT)
  // -----------------------------------------------------
  const updatePost = async () => {
    if (!editingPost) return

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${editingPost.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingPost,
          title: editedTitle,
          body: editedBody,
        }),
      },
    )

    await response.json()

    // локальное обновление UI
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id ? { ...p, title: editedTitle, body: editedBody } : p,
      ),
    )

    showToast("Пост обновлён 💾")
    closeModal()
  }

  // -----------------------------------------------------
  // Удаление поста (DELETE)
  // -----------------------------------------------------
  const deletePost = async (postId: number) => {
    await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "DELETE",
    })

    setPosts((prev) => prev.filter((p) => p.id !== postId))
    showToast("Пост удалён 🗑️")
  }

  // -----------------------------------------------------
  // Модалка: открыть / сохранить
  // -----------------------------------------------------
  const openNewModal = () => {
    setIsNew(true)
    setEditedTitle("")
    setEditedBody("")
    setShowModal(true)
  }

  const openEditModal = (post: Post) => {
    if (lockedPosts.has(post.id)) return
    setIsNew(false)
    setEditingPost(post)
    setEditedTitle(post.title)
    setEditedBody(post.body)
    setShowModal(true)
  }

  const save = () => {
    if (isNew) createPost()
    else updatePost()
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setIsNew(false)
  }

  // -----------------------------------------------------
  // UI состояния
  // -----------------------------------------------------
  if (loading)
    return (
      <div className="d-flex justify-content-center vh-100 align-items-center">
        <div>Загрузка...</div>
      </div>
    )

  if (error)
    return (
      <div className="d-flex justify-content-center vh-100 align-items-center">
        <div className="alert alert-danger">{error}</div>
      </div>
    )

  // -----------------------------------------------------
  // Основной UI
  // -----------------------------------------------------
  return (
    <>
      {toast && <ToastMessage message={toast} fading={fading} />}

      <div className="container py-4">
        <button className="btn btn-success mb-3" onClick={openNewModal}>
          ➕ Создать новый пост
        </button>

        {Object.entries(groupedPosts)
          .slice(0, 5)
          .map(([idString, userPosts]) => {
            const userId = Number(idString)
            const isOpen = openAccordions.has(userId)
            const post = userPosts[0]

            if (!post) return null

            return (
              <div key={userId} className="mb-3">
                <button
                  className="btn btn-light w-100 text-start p-3 border"
                  onClick={() => toggleAccordion(userId)}
                >
                  <b>User {userId}</b> — {userPosts.length} posts
                </button>

                {isOpen && (
                  <div className="p-3 border bg-light">
                    <h5>{post.title}</h5>
                    <p>{post.body}</p>

                    <div className="d-flex gap-2 mb-3">
                      <button
                        className={`btn btn-sm ${
                          likedPosts.has(post.id) ? "btn-danger" : "btn-outline-danger"
                        }`}
                        onClick={() => handleLike(post.id)}
                      >
                        ❤️
                      </button>

                      <button
                        className={`btn btn-sm ${
                          bookmarkedPosts.has(post.id)
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => handleBookmark(post.id)}
                      >
                        📌
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        disabled={lockedPosts.has(post.id)}
                        onClick={() => openEditModal(post)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deletePost(post.id)}
                      >
                        🗑️
                      </button>

                      <button
                        className={`btn btn-sm ${
                          lockedPosts.has(post.id)
                            ? "btn-secondary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => handleLock(post.id)}
                      >
                        {lockedPosts.has(post.id) ? "🔒" : "🔓"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* ------------------------ МОДАЛКА ------------------------ */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{isNew ? "Создать пост" : "Редактировать пост"}</h5>
                <button className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>

              <div className="modal-body">
                <label className="fw-bold">Заголовок</label>
                <input
                  className="form-control mb-3"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />

                <label className="fw-bold">Текст</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!editedTitle.trim() || !editedBody.trim()}
                  onClick={save}
                >
                  💾 {isNew ? "Создать" : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PostsAccordion

