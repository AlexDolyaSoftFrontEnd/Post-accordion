"use client"

import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"

type Post = {
  userId: number
  id: number
  title: string
  body: string
}

type GroupedPosts = {
  [userId: number]: Post[]
}

export const PostsAccordion: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set())
  const [lockedPosts, setLockedPosts] = useState<Set<number>>(new Set())
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get<Post[]>("https://jsonplaceholder.typicode.com/posts")
        setPosts(response.data)
      } catch (error) {
        console.error("Error loading posts", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const groupedPosts: GroupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.userId]) acc[post.userId] = []
    acc[post.userId].push(post)
    return acc
  }, {} as GroupedPosts)

  const toggleAccordion = (userId: string) => {
    setOpenAccordions((prev) => {
      const updated = new Set(prev)
      if (updated.has(userId)) {
        updated.delete(userId)
      } else {
        updated.add(userId)
      }
      return updated
    })
  }

  const handleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const updated = new Set(prev)
      if (updated.has(postId)) {
        updated.delete(postId)
      } else {
        updated.add(postId)
      }
      return updated
    })
  }

  const handleBookmark = (postId: number) => {
    setBookmarkedPosts((prev) => {
      const updated = new Set(prev)
      if (updated.has(postId)) {
        updated.delete(postId)
      } else {
        updated.add(postId)
      }
      return updated
    })
  }

  const handleLock = (postId: number) => {
    setLockedPosts((prev) => {
      const updated = new Set(prev)
      if (updated.has(postId)) {
        updated.delete(postId)
      } else {
        updated.add(postId)
      }
      return updated
    })
  }

  const handleEdit = (post: Post) => {
    if (lockedPosts.has(post.id)) {
      return
    }

    setEditingPost(post)
    setEditedTitle(post.title)
    setEditedBody(post.body)
    setShowModal(true)
  }

  const saveEdit = () => {
    if (!editingPost) return

    const updatedPosts = posts.map((post) =>
      post.id === editingPost.id ? { ...post, title: editedTitle, body: editedBody } : post,
    )

    setPosts(updatedPosts)
    setShowModal(false)
    setEditingPost(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setEditedTitle("")
    setEditedBody("")
  }

  if (loading) {
    return (
      <>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-2">Loading posts...</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Main Content */}
      <div className="main-content">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="card-title mb-0">👥 Users & Posts</h5>
                </div>
                <div className="card-body p-0">
                  {Object.entries(groupedPosts)
                    .slice(0, 5)
                    .map(([userId, userPosts]) => {
                      const isOpen = openAccordions.has(userId)
                      return (
                        <div key={userId}>
                          <button
                            className="btn btn-light w-100 text-start d-flex justify-content-between align-items-center p-3 border-0 rounded-0"
                            onClick={() => toggleAccordion(userId)}
                            style={{ backgroundColor: isOpen ? "#f8f9fa" : "white" }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "40px", height: "40px" }}
                              >
                                👤
                              </div>
                              <div>
                                <span className="fw-bold fs-5">User {userId}</span>
                                <div>
                                  <span className="badge bg-info text-dark">{userPosts.length} posts total</span>
                                </div>
                              </div>
                            </div>
                            <span className={`accordion-arrow fs-4 ${isOpen ? "rotated" : ""}`}>▼</span>
                          </button>

                          {isOpen && (
                            <div className="p-4 bg-light border-top">
                              {userPosts.slice(0, 1).map((post) => (
                                <div key={post.id} className="card post-card border-0 shadow-sm">
                                  <div className="card-body">
                                    <div className="row">
                                      <div className="col-lg-8 col-md-7">
                                        <div className="mb-3">
                                          <h5 className="card-title text-capitalize fw-bold text-dark mb-2">
                                            📄 {post.title}
                                          </h5>
                                          <p className="card-text text-muted lh-base">{post.body}</p>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap">
                                          {likedPosts.has(post.id) && (
                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                              ❤️ Liked
                                            </span>
                                          )}
                                          {bookmarkedPosts.has(post.id) && (
                                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                                              📌 Bookmarked
                                            </span>
                                          )}
                                          {lockedPosts.has(post.id) && (
                                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">
                                              🔒 Locked
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="col-lg-4 col-md-5">
                                        <div className="d-flex gap-2 justify-content-md-end flex-wrap mt-3 mt-md-0">
                                          <button
                                            className={`btn btn-sm ${
                                              bookmarkedPosts.has(post.id) ? "btn-primary" : "btn-outline-primary"
                                            }`}
                                            onClick={() => handleBookmark(post.id)}
                                            title={bookmarkedPosts.has(post.id) ? "Remove bookmark" : "Add bookmark"}
                                          >
                                            📌
                                          </button>

                                          <button
                                            className={`btn btn-sm ${
                                              likedPosts.has(post.id) ? "btn-danger" : "btn-outline-danger"
                                            }`}
                                            onClick={() => handleLike(post.id)}
                                            title={likedPosts.has(post.id) ? "Unlike" : "Like"}
                                          >
                                            ❤️
                                          </button>

                                          <button
                                            className="btn btn-sm btn-outline-warning"
                                            onClick={() => handleEdit(post)}
                                            title="Edit post"
                                            disabled={lockedPosts.has(post.id)}
                                          >
                                            ✏️
                                          </button>

                                          <button
                                            className={`btn btn-sm ${
                                              lockedPosts.has(post.id) ? "btn-secondary" : "btn-outline-secondary"
                                            }`}
                                            onClick={() => handleLock(post.id)}
                                            title={lockedPosts.has(post.id) ? "Unlock post" : "Lock post"}
                                          >
                                            {lockedPosts.has(post.id) ? "🔒" : "🔓"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">✏️ Edit Post</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">📝 Title</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter post title..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">📄 Content</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    placeholder="Enter post content..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ❌ Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={saveEdit}>
                  💾 Save Changes
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

