import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import "./Stories.css";


const categories = [
    "All",
    "Treks",
    "Road Trips",
    "International",
    "Budget",
    "Solo",
    "Family",
];

const API_URL = "/api";

export default function Stories() {
    const [stories, setStories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [commentText, setCommentText] = useState({});
    const [commentLoading, setCommentLoading] = useState({});
    const [commentErrors, setCommentErrors] = useState({});

    const [selectedStory, setSelectedStory] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    useEffect(() => {
        loadStories();
    }, []);

    async function loadStories() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/stories/`, {
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to load stories."
                );
            }

            setStories(data.items || []);
        } catch (err) {
            setError(
                err.message || "Unable to load stories."
            );
        } finally {
            setLoading(false);
        }
    }

    async function openStory(story) {
        setSelectedStory(story);
        setDetailLoading(true);
        setDetailError("");

        try {
            const response = await fetch(
                `${API_URL}/stories/${story.id}/`,
                {
                    credentials: "include",
                }
            );

            const text = await response.text();

            let data = {};

            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(
                        "The server returned an invalid response."
                    );
                }
            }

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to open this story."
                );
            }

            setSelectedStory(data.story || data);
        } catch (err) {
            /*
             * If the detail endpoint is unavailable, we still
             * show the story that we already loaded from /stories/.
             */
            setDetailError(err.message);
        } finally {
            setDetailLoading(false);
        }
    }

    function closeStory() {
        setSelectedStory(null);
        setDetailError("");
    }

    async function handleLike(storyId) {
        try {
            const response = await fetch(
                `${API_URL}/stories/${storyId}/like/`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to like story."
                );
            }

            setStories((currentStories) =>
                currentStories.map((story) =>
                    story.id === storyId
                        ? {
                              ...story,
                              liked: data.liked,
                              likes: data.likes,
                          }
                        : story
                )
            );

            setSelectedStory((currentStory) =>
                currentStory && currentStory.id === storyId
                    ? {
                          ...currentStory,
                          liked: data.liked,
                          likes: data.likes,
                      }
                    : currentStory
            );
        } catch (err) {
            console.error("Like error:", err);
        }
    }

    async function handleSave(storyId) {
        try {
            const response = await fetch(
                `${API_URL}/stories/${storyId}/save/`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to save story."
                );
            }

            setStories((currentStories) =>
                currentStories.map((story) =>
                    story.id === storyId
                        ? {
                              ...story,
                              saved: data.saved,
                              saves: data.saves,
                          }
                        : story
                )
            );

            setSelectedStory((currentStory) =>
                currentStory && currentStory.id === storyId
                    ? {
                          ...currentStory,
                          saved: data.saved,
                          saves: data.saves,
                      }
                    : currentStory
            );
        } catch (err) {
            console.error("Save error:", err);
        }
    }

    async function handleComment(storyId) {
        const text = (commentText[storyId] || "").trim();

        if (!text) {
            setCommentErrors((current) => ({
                ...current,
                [storyId]: "Please write a comment first.",
            }));

            return;
        }

        try {
            setCommentLoading((current) => ({
                ...current,
                [storyId]: true,
            }));

            setCommentErrors((current) => ({
                ...current,
                [storyId]: "",
            }));

            const response = await fetch(
                `${API_URL}/stories/${storyId}/comments/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to add comment."
                );
            }

            setStories((currentStories) =>
                currentStories.map((story) =>
                    story.id === storyId
                        ? {
                              ...story,
                              comments:
                                  (story.comments || 0) + 1,
                          }
                        : story
                )
            );

            setSelectedStory((currentStory) => {
                if (
                    !currentStory ||
                    currentStory.id !== storyId
                ) {
                    return currentStory;
                }

                const newComment =
                    data.comment || null;

                return {
                    ...currentStory,
                    comments:
                        Array.isArray(currentStory.comments)
                            ? newComment
                                ? [
                                      ...currentStory.comments,
                                      newComment,
                                  ]
                                : currentStory.comments
                            : (currentStory.comments || 0) + 1,
                };
            });

            setCommentText((current) => ({
                ...current,
                [storyId]: "",
            }));
        } catch (err) {
            setCommentErrors((current) => ({
                ...current,
                [storyId]:
                    err.message ||
                    "Unable to add comment.",
            }));
        } finally {
            setCommentLoading((current) => ({
                ...current,
                [storyId]: false,
            }));
        }
    }

    function handleCommentChange(storyId, value) {
        setCommentText((current) => ({
            ...current,
            [storyId]: value,
        }));
    }

async function handleDeleteStory(storyId) {
    if (!window.confirm("Delete this story? This cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/stories/${storyId}/`,
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "X-CSRFToken":
                        decodeURIComponent(
                            document.cookie
                                .split("; ")
                                .find(row =>
                                    row.startsWith("csrftoken=")
                                )
                                ?.split("=")[1] || ""
                        ),
                },
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                "Unable to delete story."
            );
        }

        setStories(current =>
            current.filter(story => story.id !== storyId)
        );

        setSelectedStory(current =>
            current?.id === storyId
                ? null
                : current
        );

    } catch (err) {
        alert(
            err.message ||
            "Unable to delete story."
        );
    }
}

    async function handleDeleteComment(commentId, storyId) {
        if (!window.confirm("Delete this comment?")) return;
        try {
            const response = await fetch(`${API_URL}/comments/${commentId}/`, { method: "DELETE", credentials: "include" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "Unable to delete comment.");
            setSelectedStory(current => current && current.id === storyId && Array.isArray(current.comments) ? { ...current, comments: current.comments.filter(c => c.id !== commentId) } : current);
            setStories(current => current.map(story => story.id === storyId ? { ...story, comments: Math.max(0, (story.comments || 0) - 1) } : story));
        } catch (err) { alert(err.message || "Unable to delete comment."); }
    }

    const filteredStories =
        activeCategory === "All"
            ? stories
            : stories.filter((story) => {
                  const tags = story.tags || [];

                  return tags.some(
                      (tag) =>
                          tag.toLowerCase() ===
                          activeCategory.toLowerCase()
                  );
              });

    return (
        <Layout>
            <div className="stories-page">
                <div className="stories-header">
                    <div>
                        <h1>Stories</h1>
                        <p>
                            Real experiences. Told honestly.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => {
                            window.location.href =
                                "/stories/new";
                        }}
                    >
                        + Share your story
                    </button>
                </div>

                <div className="story-categories">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={
                                activeCategory === category
                                    ? "category active"
                                    : "category"
                            }
                            onClick={() =>
                                setActiveCategory(category)
                            }
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="stories-message">
                        Loading stories...
                    </div>
                )}

                {error && !loading && (
                    <div className="stories-error">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredStories.length === 0 && (
                        <div className="stories-message">
                            No stories found in this category.
                        </div>
                    )}

                <div className="stories-grid">
                    {filteredStories.map((story) => (
                        <article
                            className="story-card"
                            key={story.id}
                        >
                            <div
    className="story-image"
    onClick={() => openStory(story)}
>
    {story.media?.length > 0 ? (
        story.media[0].type === "video" ? (
            <video
                src={story.media[0].url}
                muted
                playsInline
                preload="metadata"
                className="story-media-preview"
            />
        ) : (
            <img
                src={story.media[0].url}
                alt={story.title || "Travel story"}
                className="story-media-preview"
            />
        )
    ) : (
        <div className="story-image-fallback">
            <span>
                {story.type || "Story"}
            </span>
        </div>
    )}

    <span className="story-type-badge">
        {story.type || "Story"}
    </span>

    {story.media?.length > 1 && (
        <span className="story-media-count">
            +{story.media.length - 1}
        </span>
    )}
</div>
                            <div className="story-content">
                                <div className="story-author">
                                    <div className="author-avatar">
                                        {story.author?.initials ||
                                            story.author?.username
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                            "U"}
                                    </div>

                                    <div>
                                        <strong>
                                            {story.author?.name ||
                                                story.author
                                                    ?.username ||
                                                "Traveler"}
                                        </strong>

                                        <small>
                                            📍{" "}
                                            {story.location ||
                                                "India"}
                                        </small>
                                    </div>

                                    <span className="read-time">
                                        {story.readTime ||
                                            "5 min"}
                                    </span>
                                </div>

                                <h2
                                    onClick={() =>
                                        openStory(story)
                                    }
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    {story.title}
                                </h2>

                                <p className="story-excerpt">
                                    {story.excerpt ||
                                        story.body ||
                                        "A travel story shared by the community."}
                                </p>

                                <div className="story-tags">
                                    {(story.tags || []).map(
                                        (tag) => (
                                            <span key={tag}>
                                                {tag}
                                            </span>
                                        )
                                    )}
                                </div>

                                <div className="story-actions">
                                    <button
                                        className={
                                            story.liked
                                                ? "action active"
                                                : "action"
                                        }
                                        onClick={() =>
                                            handleLike(
                                                story.id
                                            )
                                        }
                                    >
                                        ♥{" "}
                                        {story.likes || 0}
                                    </button>

                                    <button
                                        className="action"
                                        onClick={() =>
                                            openStory(story)
                                        }
                                    >
                                        💬{" "}
                                        {Array.isArray(
                                            story.comments
                                        )
                                            ? story.comments
                                                  .length
                                            : story.comments ||
                                              0}
                                    </button>

                                    <button
                                        className={
                                            story.saved
                                                ? "action active"
                                                : "action"
                                        }
                                        onClick={() =>
                                            handleSave(
                                                story.id
                                            )
                                        }
                                    >
                                        🔖{" "}
                                        {story.saves || 0}
                                    </button>
                                    {story.isOwner && (
                                        <button className="action" onClick={() => handleDeleteStory(story.id)}>🗑️ Delete</button>
                                    )}
                                </div>

                                <div className="comment-box">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={
                                            commentText[
                                                story.id
                                            ] || ""
                                        }
                                        onChange={(event) =>
                                            handleCommentChange(
                                                story.id,
                                                event.target
                                                    .value
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key ===
                                                "Enter"
                                            ) {
                                                handleComment(
                                                    story.id
                                                );
                                            }
                                        }}
                                    />

                                    <button
                                        onClick={() =>
                                            handleComment(
                                                story.id
                                            )
                                        }
                                        disabled={
                                            commentLoading[
                                                story.id
                                            ]
                                        }
                                    >
                                        {commentLoading[
                                            story.id
                                        ]
                                            ? "..."
                                            : "Post"}
                                    </button>
                                </div>

                                {commentErrors[story.id] && (
                                    <p className="comment-error">
                                        {
                                            commentErrors[
                                                story.id
                                            ]
                                        }
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {selectedStory && (
                <div
                    className="story-modal-backdrop"
                    onClick={closeStory}
                >
                    <div
                        className="story-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            className="story-modal-close"
                            onClick={closeStory}
                        >
                            ×
                        </button>

                        {detailLoading && (
                            <div className="stories-message">
                                Loading story...
                            </div>
                        )}

                        <div className="story-detail">
                            <div className="story-detail-type">
                                {selectedStory.type ||
                                    "Story"}
                            </div>

                            <h1>
                                {selectedStory.title}
                            </h1>

                            <div className="story-detail-author">
                                <div className="author-avatar">
                                    {selectedStory.author
                                        ?.initials ||
                                        selectedStory.author
                                            ?.username
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                        "U"}
                                </div>

                                <div>
                                    <strong>
                                        {selectedStory.author
                                            ?.name ||
                                            selectedStory.author
                                                ?.username ||
                                            "Traveler"}
                                    </strong>

                                    <small>
                                        📍{" "}
                                        {selectedStory.location ||
                                            "India"}
                                    </small>
                                </div>
                            </div>

                            <div className="story-detail-actions">
                                <button
                                    className={
                                        selectedStory.liked
                                            ? "action active"
                                            : "action"
                                    }
                                    onClick={() =>
                                        handleLike(
                                            selectedStory.id
                                        )
                                    }
                                >
                                    ♥{" "}
                                    {selectedStory.likes ||
                                        0}
                                </button>

                                <button
                                    className={
                                        selectedStory.saved
                                            ? "action active"
                                            : "action"
                                    }
                                    onClick={() =>
                                        handleSave(
                                            selectedStory.id
                                        )
                                    }
                                >
                                    🔖{" "}
                                    {selectedStory.saves ||
                                        0}
                                </button>

                                {selectedStory.isOwner && (
                                    <button className="action" onClick={() => handleDeleteStory(selectedStory.id)}>🗑️ Delete</button>
                                )}
                            </div>

                            {detailError && (
                                <div className="stories-error">
                                    {detailError}
                                </div>
                            )}

                            <div className="story-full-body">
                                {selectedStory.body ||
                                    selectedStory.excerpt ||
                                    "No story content available."}
                            </div>

                            <div className="story-detail-tags">
                                {(selectedStory.tags || []).map(
                                    (tag) => (
                                        <span key={tag}>
                                            {tag}
                                        </span>
                                    )
                                )}
                            </div>

                            <hr />

                            <h3>
                                Comments{" "}
                                {Array.isArray(
                                    selectedStory.comments
                                )
                                    ? `(${selectedStory.comments.length})`
                                    : ""}
                            </h3>

                            <div className="story-detail-comment-box">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={
                                        commentText[
                                            selectedStory.id
                                        ] || ""
                                    }
                                    onChange={(event) =>
                                        handleCommentChange(
                                            selectedStory.id,
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            handleComment(
                                                selectedStory.id
                                            );
                                        }
                                    }}
                                />

                                <button
                                    onClick={() =>
                                        handleComment(
                                            selectedStory.id
                                        )
                                    }
                                    disabled={
                                        commentLoading[
                                            selectedStory.id
                                        ]
                                    }
                                >
                                    {commentLoading[
                                        selectedStory.id
                                    ]
                                        ? "Posting..."
                                        : "Post"}
                                </button>
                            </div>

                            {commentErrors[
                                selectedStory.id
                            ] && (
                                <p className="comment-error">
                                    {
                                        commentErrors[
                                            selectedStory.id
                                        ]
                                    }
                                </p>
                            )}

                            <div className="comments-list">
                                {Array.isArray(
                                    selectedStory.comments
                                ) &&
                                    selectedStory.comments.map(
                                        (comment) => (
                                            <div
                                                className="comment"
                                                key={
                                                    comment.id
                                                }
                                            >
                                                <div className="comment-avatar">
                                                    {comment
                                                        .author
                                                        ?.initials ||
                                                        comment
                                                            .author
                                                            ?.username
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase() ||
                                                        "U"}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {comment
                                                            .author
                                                            ?.name ||
                                                            comment
                                                                .author
                                                                ?.username ||
                                                            "Traveler"}
                                                    </strong>

                                                    <p>
                                                        {
                                                            comment.text
                                                        }
                                                    </p>
                                                    {comment.isOwner && (
                                                        <button type="button" className="logout-mini" onClick={() => handleDeleteComment(comment.id, selectedStory.id)}>Delete</button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}

                                {Array.isArray(
                                    selectedStory.comments
                                ) &&
                                    selectedStory.comments
                                        .length === 0 && (
                                        <p className="no-comments">
                                            No comments yet.
                                            Be the first to
                                            comment.
                                        </p>
                                    )}

                                {!Array.isArray(
                                    selectedStory.comments
                                ) && (
                                    <p className="no-comments">
                                        Opened story successfully.
                                        Comments will appear
                                        here when the detail
                                        endpoint returns them.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}