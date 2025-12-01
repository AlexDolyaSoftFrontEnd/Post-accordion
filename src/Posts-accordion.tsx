"use client"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import "./oneui.css"

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
// Уведомления Samsung One UI
// -----------------------------------------------------
const ToastMessage: React.FC<{ message: string; fading: boolean }> = ({
  message,
  fading,
}) => (
  <div
    className="oneui-toast"
    style={{
      position: "fixed",
      top: 20,
      right: 20,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.7s ease",
      zIndex: 9999,
    }}
  >
    {message}
  </div>
)

export const PostsAccordion: React.FC = () => {
  // --------------------------------------------
  // Состояния
  // --------------------------------------------
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [likedPosts, setLikedPosts] = useState(new Set<number>())
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set<number>())
  const [lockedPosts, setLockedPosts] = useState(new Set<number>())

  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [isNew, setIsNew] = useState(false)

  const [openAccordions, setOpenAccordions] = useState(new Set<number>())

  const [toast, setToast] = useState("")
  const [fading, setFading] = useState(false)

  // --------------------------------------------
  // Toast
  // --------------------------------------------
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
  // Группировка постов
  // --------------------------------------------
  const groupedPosts = useMemo(() => {
    return posts.reduce((acc, p) => {
      if (!acc[p.userId]) acc[p.userId] = []
      acc[p.userId].push(p)
      return acc
    }, {} as GroupedPosts)
  }, [posts])

  // --------------------------------------------
  // Переключатели
  // --------------------------------------------
  const toggleAccordion = (id: number) =>
    setOpenAccordions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    id: number,
  ) =>
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // --------------------------------------------
  // Лайк / Bookmark / Lock
  // --------------------------------------------
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

  // --------------------------------------------
  // Создание поста
  // --------------------------------------------
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

    setPosts((prev) => [{ ...created, id: prev.length + 1000 }, ...prev])
    showToast("Пост создан 🎉")
    closeModal()
  }

  // --------------------------------------------
  // Обновление поста
  // --------------------------------------------
  const updatePost = async () => {
    if (!editingPost) return

    await fetch(`https://jsonplaceholder.typicode.com/posts/${editingPost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editingPost,
        title: editedTitle,
        body: editedBody,
      }),
    })

    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id ? { ...p, title: editedTitle, body: editedBody } : p,
      ),
    )

    showToast("Пост обновлён 💾")
    closeModal()
  }

  // --------------------------------------------
  // Удаление поста
  // --------------------------------------------
  const deletePost = async (postId: number) => {
    await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "DELETE",
    })

    setPosts((prev) => prev.filter((p) => p.id !== postId))
    showToast("Пост удалён 🗑️")
  }

  // --------------------------------------------
  // Модальные окна
  // --------------------------------------------
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

  const save = () => (isNew ? createPost() : updatePost())

  const closeModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setIsNew(false)
  }

  // --------------------------------------------
  // UI
  // --------------------------------------------
  if (loading)
    return <div className="d-flex justify-content-center vh-100">Загрузка…</div>

  if (error)
    return <div className="d-flex justify-content-center vh-100">{error}</div>

  return (
    <>
      {toast && <ToastMessage message={toast} fading={fading} />}

      <div className="container py-4">
        <button className="oneui-btn oneui-btn-accent mb-3" onClick={openNewModal}>
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
                {/* Кнопка аккордиона со стрелкой */}
                <button
                  className="oneui-accordion-btn"
                  onClick={() => toggleAccordion(userId)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <b>User {userId}</b> — {userPosts.length} posts
                    </span>

                    {/* Стрелка Samsung */}
                    <span
                      className={`oneui-chevron ${isOpen ? "open" : ""}`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {/* Контент аккордиона + анимация */}
                <div
                  className={`oneui-accordion-wrapper ${
                    isOpen ? "open" : ""
                  }`}
                >
                  <div className="oneui-accordion-content">
                    <h5>{post.title}</h5>
                    <p>{post.body}</p>

                    <div className="d-flex gap-2 mb-3">
                      <button
                        className={`oneui-icon-btn ${
                          likedPosts.has(post.id) ? "active" : ""
                        }`}
                        onClick={() => handleLike(post.id)}
                      >
                        ❤️
                      </button>

                      <button
                        className={`oneui-icon-btn ${
                          bookmarkedPosts.has(post.id) ? "active" : ""
                        }`}
                        onClick={() => handleBookmark(post.id)}
                      >
                        📌
                      </button>

                      <button
                        className="oneui-icon-btn"
                        disabled={lockedPosts.has(post.id)}
                        onClick={() => openEditModal(post)}
                      >
                        ✏️
                      </button>

                      <button
                        className="oneui-icon-btn"
                        onClick={() => deletePost(post.id)}
                      >
                        🗑️
                      </button>

                      <button
                        className={`oneui-icon-btn ${
                          lockedPosts.has(post.id) ? "active" : ""
                        }`}
                        onClick={() => handleLock(post.id)}
                      >
                        {lockedPosts.has(post.id) ? "🔒" : "🔓"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Модальное окно Samsung */}
      {showModal && (
        <div className="modal show d-block oneui-modal-blur">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content oneui-modal-content">
              <h5 className="mb-3">{isNew ? "Создать пост" : "Редактировать пост"}</h5>

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

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="oneui-btn oneui-btn-outline" onClick={closeModal}>
                  Отмена
                </button>

                <button
                  className="oneui-btn oneui-btn-accent"
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
