"use client"

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  memo,
} from "react"
import { useNavigate } from "react-router-dom" // Импорт хука навигации
import "./Oneui.css"

// -----------------------------------------------------
// Типы (Types)
// Описываем структуру данных, чтобы TypeScript помогал нам избегать ошибок.
// -----------------------------------------------------
export type Post = {
  userId: number
  id: number
  title: string
  body: string
}

// Тип для создания/редактирования (без ID и UserId, так как они системные)
type PostPayload = Omit<Post, "id" | "userId">

// -----------------------------------------------------
// Toast компонент (Уведомления)
// Мемоизирован, чтобы не перерисовываться без изменения пропсов.
// -----------------------------------------------------
const Toast = memo<{ message: string; fading: boolean }>(({ message, fading }) => {
  // Если сообщения нет, ничего не рендерим
  if (!message) return null

  return (
    <div
      className="oneui-toast"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        opacity: fading ? 0 : 1, // Анимация исчезновения 
        transition: "opacity .6s ease",
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  )
})

// -----------------------------------------------------
// Modal (Модальное окно)
// Отвечает за формы создания и редактирования.
// -----------------------------------------------------
interface PostModalProps {
  isOpen: boolean
  isNew: boolean
  initialData: PostPayload
  onClose: () => void
  onSave: (title: string, body: string) => void
}

const PostModal = memo<PostModalProps>(
  ({ isOpen, isNew, initialData, onClose, onSave }) => {
    // Локальное состояние полей ввода
    const [title, setTitle] = useState(initialData.title)
    const [body, setBody] = useState(initialData.body)

    // Эффект: при открытии окна обновляем поля ввода данными из пропсов
    useEffect(() => {
      if (isOpen) {
        setTitle(initialData.title)
        setBody(initialData.body)
      }
    }, [isOpen, initialData])

    if (!isOpen) return null

    return (
      <div className="modal show d-block oneui-modal-blur">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content oneui-modal-content">
            <h5 className="mb-3">{isNew ? "Создать пост" : "Редактировать пост"}</h5>

            <label className="fw-bold">Заголовок</label>
            <input
              className="form-control mb-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок..."
            />

            <label className="fw-bold">Текст</label>
            <textarea
              className="form-control"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Введите содержимое..."
            />

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="oneui-btn oneui-btn-outline" onClick={onClose}>
                Отмена
              </button>
              {/* Кнопка активна только если поля не пустые */}
              <button
                className="oneui-btn oneui-btn-accent"
                disabled={!title.trim() || !body.trim()}
                onClick={() => onSave(title, body)}
              >
                💾 {isNew ? "Создать" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// -----------------------------------------------------
// Accordion Item (Элемент списка)
// Отображает отдельный пост и кнопки действий.
// -----------------------------------------------------
interface AccordionItemProps {
  userPosts: Post[]
  userId: number
  isOpen: boolean
  statusState: {
    liked: boolean
    bookmarked: boolean
    locked: boolean
  }
  onToggle: (id: number) => void
  // Объект с функциями-обработчиками
  actions: {
    onLike: (id: number) => void
    onBookmark: (id: number) => void
    onLock: (id: number) => void
    onEdit: (post: Post) => void
    onDelete: (id: number) => void
  }
}

const AccordionItem = memo<AccordionItemProps>(
  ({ userPosts, userId, isOpen, statusState, onToggle, actions }) => {
    // Берем первый пост пользователя для отображения
    const post = userPosts[0]
    if (!post) return null

    const { liked, bookmarked, locked } = statusState

    return (
      <div className="mb-3">
        {/* Заголовок аккордеона (кнопка раскрытия) */}
        <button
          className="oneui-accordion-btn"
          onClick={() => onToggle(userId)}
        >
          <div className="d-flex justify-content-between align-items-center">
            <b>Post</b>
            {/* Стрелочка, поворачивающаяся при открытии */}
            <span className={`oneui-chevron ${isOpen ? "open" : ""}`}>▼</span>
          </div>
        </button>

        {/* Тело аккордеона с анимацией */}
        <div className={`oneui-accordion-wrapper ${isOpen ? "open" : ""}`}>
          <div className="oneui-accordion-content">
            <h5>{post.title}</h5>
            <p>{post.body}</p>

            {/* Панель действий */}
            <div className="d-flex gap-2 mb-3">
              <button
                className={`oneui-icon-btn ${liked ? "active" : ""}`}
                onClick={() => actions.onLike(post.id)}
                title="Нравится"
              >
                ❤️
              </button>

              <button
                className={`oneui-icon-btn ${bookmarked ? "active" : ""}`}
                onClick={() => actions.onBookmark(post.id)}
                title="В закладки"
              >
                📌
              </button>

              {/* Кнопка редактирования заблокирована, если пост locked */}
              <button
                className="oneui-icon-btn"
                disabled={locked}
                onClick={() => actions.onEdit(post)}
                title="Редактировать"
              >
                ✏️
              </button>

              <button
                className="oneui-icon-btn"
                onClick={() => actions.onDelete(post.id)}
                title="Удалить"
              >
                🗑️
              </button>

              <button
                className={`oneui-icon-btn ${locked ? "active" : ""}`}
                onClick={() => actions.onLock(post.id)}
                title="Блокировать изменения"
              >
                {locked ? "🔒" : "🔓"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// -----------------------------------------------------
// Custom Hooks (Кастомные хуки)
// Вынос логики из компонента для чистоты кода.
// -----------------------------------------------------

// Хук для управления показом уведомлений
const useToast = () => {
  const [toastState, setToastState] = useState({ message: "", fading: false })

  const showToast = useCallback((msg: string) => {
    // Показываем сообщение
    setToastState({ message: msg, fading: false })

    // Через 1.4с включаем анимацию исчезновения
    setTimeout(() => setToastState((p) => ({ ...p, fading: true })), 1400)
    
    // Через 2.1с полностью убираем сообщение
    setTimeout(() => setToastState({ message: "", fading: false }), 2100)
  }, [])

  return { ...toastState, showToast }
}

// Хук для работы с множествами (Set) - хранит ID лайкнутых/заблокированных постов
const useEntitySet = (initial = new Set<number>()) => {
  const [set, setSet] = useState(initial)

  const toggle = useCallback((id: number) => {
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return [set, toggle] as const
}

// Хук для загрузки и управления данными (CRUD)
const usePostsData = (showToast: (msg: string) => void) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка данных при монтировании
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch(() => setError("Ошибка загрузки постов."))
      .finally(() => setLoading(false))
  }, [])

  // Создание поста
  const createPost = async (title: string, body: string) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    })

    const created = await res.json()
    // Добавляем новый пост в начало списка с уникальным ID
    setPosts((prev) => [{ ...created, id: Date.now() }, ...prev])
    showToast("Пост успешно создан 🎉")
  }

  // Обновление поста
  const updatePost = async (post: Post, title: string, body: string) => {
    await fetch(`https://jsonplaceholder.typicode.com/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...post, title, body }),
    })

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, title, body } : p))
    )
    showToast("Изменения сохранены 💾")
  }

  // Удаление поста
  const deletePost = async (id: number) => {
    await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
      method: "DELETE",
    })

    setPosts((prev) => prev.filter((p) => p.id !== id))
    showToast("Пост удалён в корзину 🗑️")
  }

  return { posts, loading, error, createPost, updatePost, deletePost }
}

// -----------------------------------------------------
// Основной компонент
// Собирает всё воедино.
// -----------------------------------------------------
export const PostsAccordion: React.FC = () => {
  // Хук навигации из react-router-dom
  const navigate = useNavigate()
  
  // Подключаем наши кастомные хуки
  const { message, fading, showToast } = useToast()
  const { posts, loading, error, createPost, updatePost, deletePost } =
    usePostsData(showToast)

  // Состояния для "фишек" (Лайки, Закладки, Замки, Открытые аккордеоны)
  const [likedPosts, toggleLikeSet] = useEntitySet()
  const [bookmarkedPosts, toggleBookmarkSet] = useEntitySet()
  const [lockedPosts, toggleLockSet] = useEntitySet()
  const [openAccordions, toggleAccordion] = useEntitySet()

  // Состояние модального окна
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewPost, setIsNewPost] = useState(false)

  // Группировка постов по UserId (мемоизирована для производительности)
  const groupedPosts = useMemo(
    () =>
      posts.reduce((acc, p) => {
        acc[p.userId] ??= []
        acc[p.userId].push(p)
        return acc
      }, {} as Record<number, Post[]>),
    [posts]
  )

  // -----------------------------------------------------
  // Обработчики событий (Handlers) с уведомлениями
  // -----------------------------------------------------

  // Обработчик лайка
  const handleLike = useCallback((id: number) => {
    // Проверяем, был ли лайк до клика
    const isAlreadyLiked = likedPosts.has(id)
    toggleLikeSet(id)
    showToast(isAlreadyLiked ? "Лайк удалён 💔" : "Лайк поставлен ❤️")
  }, [likedPosts, toggleLikeSet, showToast])

  // Обработчик закладки
  const handleBookmark = useCallback((id: number) => {
    const isAlreadyBookmarked = bookmarkedPosts.has(id)
    toggleBookmarkSet(id)
    showToast(isAlreadyBookmarked ? "Убрано из закладок 📂" : "Добавлено в закладки 📌")
  }, [bookmarkedPosts, toggleBookmarkSet, showToast])

  // Обработчик блокировки
  const handleLock = useCallback((id: number) => {
    const isAlreadyLocked = lockedPosts.has(id)
    toggleLockSet(id)
    showToast(isAlreadyLocked ? "Пост разблокирован 🔓" : "Пост заблокирован от изменений 🔒")
  }, [lockedPosts, toggleLockSet, showToast])

  // Обработчик открытия редактора
  const handleEditOpen = useCallback(
    (post: Post) => {
      // Если пост заблокирован, не открываем модалку, а шлем уведомление
      if (lockedPosts.has(post.id)) {
        showToast("Ошибка: Пост заблокирован для редактирования ⛔")
        return
      }
      setIsNewPost(false)
      setEditingPost(post)
      setIsModalOpen(true)
    },
    [lockedPosts, showToast]
  )

  // Сохранение из модального окна
  const handleModalSave = (title: string, body: string) => {
    if (isNewPost) {
      createPost(title, body)
    } else {
      updatePost(editingPost!, title, body)
    }
    setIsModalOpen(false)
  }

  // Навигация
  const handleNavigateHome = () => {
    navigate("/") // Пример перехода в корень
    // showToast("Переход на главную...") // Можно раскомментировать, если нужно
  }

  // -----------------------------------------------------
  // Рендер (UI)
  // -----------------------------------------------------

  if (loading)
    return (
      <div className="d-flex justify-content-center vh-100 align-items-center">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2">Загрузка данных…</span>
      </div>
    )

  if (error)
    return (
      <div className="d-flex justify-content-center vh-100 align-items-center text-danger">
        {error}
      </div>
    )

  return (
    <>
      {/* Компонент уведомлений висит поверх всего */}
      <Toast message={message} fading={fading} />

      <div className="container py-4">
        {/* Верхняя панель с кнопками */}
        <div className="d-flex justify-content-between mb-3">
            <button
              className="oneui-btn oneui-btn-accent"
              onClick={() => {
                setIsNewPost(true)
                setEditingPost(null)
                setIsModalOpen(true)
              }}
            >
              ➕ Новый пост
            </button>

            {/* Кнопка навигации 
            <button
              className="oneui-btn oneui-btn-outline"
              onClick={handleNavigateHome}
            >
              🏠 На главную
            </button>
            */}
        </div>

        {/* Список аккордеонов (Посты) */}
        {Object.entries(groupedPosts)
          .slice(0, 5) // Ограничиваем список для демо
          .map(([id, items]) => {
            const userId = Number(id)
            const post = items[0]
            if (!post) return null

            return (
              <AccordionItem
                key={userId}
                userId={userId}
                userPosts={items}
                isOpen={openAccordions.has(userId)}
                onToggle={toggleAccordion}
                // Передаем текущие статусы (есть ли лайк/замок и т.д.)
                statusState={{
                  liked: likedPosts.has(post.id),
                  bookmarked: bookmarkedPosts.has(post.id),
                  locked: lockedPosts.has(post.id),
                }}
                // Передаем наши новые обертки с уведомлениями
                actions={{
                  onLike: handleLike,
                  onBookmark: handleBookmark,
                  onLock: handleLock,
                  onEdit: handleEditOpen,
                  onDelete: deletePost,
                }}
              />
            )
          })}
      </div>

      {/* Модальное окно (Создание / Редактирование) */}
      <PostModal
        isOpen={isModalOpen}
        isNew={isNewPost}
        initialData={{
          title: editingPost?.title || "",
          body: editingPost?.body || "",
        }}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
      />
    </>
  )
}

export default PostsAccordion