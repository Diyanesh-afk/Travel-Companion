import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './Home.css';
import destinationImages from '../data/destinationImages';

const API_URL = '/api';

export default function Home() {
    const navigate = useNavigate();

    const [data, setData] = useState({
        stories: [],
        questions: [],
        destinations: []
    });

    const [loading, setLoading] = useState(true);

    const [commentText, setCommentText] = useState({});
    const [commentLoading, setCommentLoading] = useState({});
    const [commentErrors, setCommentErrors] = useState({});

    /*
     * Story detail modal
     */
    const [selectedStory, setSelectedStory] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailComment, setDetailComment] = useState('');
    const [detailCommentLoading, setDetailCommentLoading] =
        useState(false);
    const [detailCommentError, setDetailCommentError] =
        useState('');

    const tags = [
        '#beaches',
        '#budget travel',
        '#solo',
        '#road trips',
        '#hikes',
        '#food trails',
        '#offbeat',
        '#family'
    ];

    useEffect(() => {
        loadHome();
    }, []);

    async function loadHome() {
        try {
            const response = await fetch(
                `${API_URL}/home/`,
                {
                    credentials: 'include'
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || 'Unable to load home.'
                );
            }

            setData({
                stories: Array.isArray(result.stories)
                    ? result.stories
                    : [],

                questions: Array.isArray(result.questions)
                    ? result.questions
                    : [],

                destinations: Array.isArray(result.destinations)
                    ? result.destinations
                    : []
            });

        } catch (error) {
            console.error(
                'Home loading failed:',
                error
            );

            setData({
                stories: [],
                questions: [],
                destinations: []
            });

        } finally {
            setLoading(false);
        }
    }


    /*
     * ============================================
     * LIKE
     * ============================================
     */

    async function handleLike(storyId) {
        try {
            const response = await fetch(
                `${API_URL}/stories/${storyId}/like/`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Unable to like story.'
                );
            }

            setData(current => ({
                ...current,

                stories: current.stories.map(story =>
                    story.id === storyId
                        ? {
                            ...story,
                            liked: result.liked,
                            likes: result.likes
                        }
                        : story
                )
            }));

            /*
             * Also update the open story if it is
             * currently being viewed.
             */
            setSelectedStory(current => {
                if (!current || current.id !== storyId) {
                    return current;
                }

                return {
                    ...current,
                    liked: result.liked,
                    likes: result.likes
                };
            });

        } catch (error) {
            console.error(
                'Like error:',
                error
            );
        }
    }


    /*
     * ============================================
     * SAVE
     * ============================================
     */

    async function handleSave(storyId) {
        try {
            const response = await fetch(
                `${API_URL}/stories/${storyId}/save/`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Unable to save story.'
                );
            }

            setData(current => ({
                ...current,

                stories: current.stories.map(story =>
                    story.id === storyId
                        ? {
                            ...story,
                            saved: result.saved,
                            saves: result.saves
                        }
                        : story
                )
            }));

            setSelectedStory(current => {
                if (!current || current.id !== storyId) {
                    return current;
                }

                return {
                    ...current,
                    saved: result.saved,
                    saves: result.saves
                };
            });

        } catch (error) {
            console.error(
                'Save error:',
                error
            );
        }
    }


    /*
     * ============================================
     * OPEN STORY DETAIL
     * ============================================
     */

    async function openStory(storyId) {
        try {
            setDetailLoading(true);
            setDetailCommentError('');
            setDetailComment('');

            const response = await fetch(
                `${API_URL}/stories/${storyId}/`,
                {
                    credentials: 'include'
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Unable to load story.'
                );
            }

            setSelectedStory(result.story);

        } catch (error) {
            console.error(
                'Story detail error:',
                error
            );

        } finally {
            setDetailLoading(false);
        }
    }


    /*
     * ============================================
     * CLOSE STORY DETAIL
     * ============================================
     */

    function closeStory() {
        setSelectedStory(null);
        setDetailComment('');
        setDetailCommentError('');
    }


    /*
     * ============================================
     * COMMENT FROM HOME CARD
     * ============================================
     */

    async function handleComment(storyId) {
        const text = (
            commentText[storyId] || ''
        ).trim();

        if (!text) {
            setCommentErrors(current => ({
                ...current,
                [storyId]:
                    'Please write a comment first.'
            }));

            return;
        }

        try {
            setCommentLoading(current => ({
                ...current,
                [storyId]: true
            }));

            setCommentErrors(current => ({
                ...current,
                [storyId]: ''
            }));

            const response = await fetch(
                `${API_URL}/stories/${storyId}/comments/`,
                {
                    method: 'POST',
                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        text
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Unable to add comment.'
                );
            }

            setData(current => ({
                ...current,

                stories: current.stories.map(story =>
                    story.id === storyId
                        ? {
                            ...story,
                            comments:
                                (story.comments || 0) + 1
                        }
                        : story
                )
            }));

            setCommentText(current => ({
                ...current,
                [storyId]: ''
            }));

            /*
             * If the story is already open in the detail
             * modal, reload it so the new comment appears.
             */
            if (
                selectedStory &&
                selectedStory.id === storyId
            ) {
                openStory(storyId);
            }

        } catch (error) {
            setCommentErrors(current => ({
                ...current,
                [storyId]: error.message
            }));

        } finally {
            setCommentLoading(current => ({
                ...current,
                [storyId]: false
            }));
        }
    }


    function handleCommentChange(
        storyId,
        value
    ) {
        setCommentText(current => ({
            ...current,
            [storyId]: value
        }));
    }


    /*
     * ============================================
     * COMMENT INSIDE STORY DETAIL
     * ============================================
     */

    async function handleDetailComment() {
        const text = detailComment.trim();

        if (!text) {
            setDetailCommentError(
                'Please write a comment first.'
            );

            return;
        }

        if (!selectedStory) {
            return;
        }

        try {
            setDetailCommentLoading(true);
            setDetailCommentError('');

            const response = await fetch(
                `${API_URL}/stories/${selectedStory.id}/comments/`,
                {
                    method: 'POST',
                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        text
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Unable to add comment.'
                );
            }

            /*
             * Reload the story detail.
             *
             * This is important because it gets ALL
             * comments from Django, including the new one.
             */
            await openStory(selectedStory.id);

            setDetailComment('');

            /*
             * Update the comment count on the Home card.
             */
            setData(current => ({
                ...current,

                stories: current.stories.map(story =>
                    story.id === selectedStory.id
                        ? {
                            ...story,
                            comments:
                                (story.comments || 0) + 1
                        }
                        : story
                )
            }));

        } catch (error) {
            setDetailCommentError(
                error.message
            );

        } finally {
            setDetailCommentLoading(false);
        }
    }


    return (
        <Layout
            searchPlaceholder="Search destinations, stories, tips..."
        >

            <div className="home-grid">

                {/* =====================================
                    MAIN
                ====================================== */}

                <div className="home-main">

                    {/* HERO */}

                    <div className="hero-banner">

                        <div className="hero-overlay" />

                        <div className="hero-content">

                            <div className="hero-tag">
                                Travel Companion
                            </div>

                            <div className="hero-title">
                                Real trips. Real stories.
                                <br />
                                Plan your next escape.
                            </div>

                            <div className="hero-sub">
                                Discover destinations and learn
                                from other travellers.
                            </div>

                        </div>

                    </div>


                    {/* DESTINATIONS */}

                    <div className="section-label">
                        Popular destinations
                    </div>

                    {data.destinations.length === 0 ? (

                        <div className="empty-state">
                            <div className="empty-text">
                                No destinations available yet.
                            </div>
                        </div>

                    ) : (

                        <div className="dest-row">

                            {data.destinations.map(
                                destination => (

                                    <button
                                        type="button"
                                        className="dest-card"
                                        key={destination.id}
                                        onClick={() =>
    navigate(
        `/destinations/${destination.id}`
    )
}
                                       
                                    >
<div
    className="dest-img"
    style={{
        backgroundImage:
            destinationImages[destination.name]
                ? `url("${destinationImages[destination.name]}")`
                : 'linear-gradient(135deg, #159957, #155799)',

        backgroundSize: 'cover',
        backgroundPosition: 'center'
    }}
>
    {!destinationImages[destination.name] && (
        <span>
            {destination.emoji || '📍'}
        </span>
    )}
</div>

                                        <div className="dest-info">

                                            <div className="dest-name">
                                                {destination.name}
                                            </div>

                                            <div className="dest-tag">
                                                {destination.tag ||
                                                    'Explore'}
                                            </div>

                                        </div>

                                    </button>

                                )
                            )}

                        </div>

                    )}


                    {/* STORIES */}

                    <div
                        className="section-label"
                        style={{
                            marginTop: '24px'
                        }}
                    >
                        Recent stories & posts
                    </div>


                    {loading ? (

                        <div className="empty-state">
                            <div className="empty-text">
                                Loading stories...
                            </div>
                        </div>

                    ) : data.stories.length === 0 ? (

                        <div className="empty-state">
                            <div className="empty-text">
                                No stories available yet.
                            </div>
                        </div>

                    ) : (

                        data.stories.map(story => (

                            <div
                                className="post-card"
                                key={story.id}
                            >

                                {/* AUTHOR */}

                                <div className="post-meta">

                                    <div
                                        className="post-avatar"
                                        style={{
                                            background:
                                                '#D85A30'
                                        }}
                                    >
                                        {story.author?.initials ||
                                            'U'}
                                    </div>

                                    <div>

                                        <div className="post-author">
                                            {story.author?.name ||
                                                story.author?.username ||
                                                'Traveler'}
                                        </div>

                                        <div className="post-loc">
                                            📍{' '}
                                            {story.location ||
                                                'India'}
                                        </div>

                                    </div>

                                </div>


                                {/* TITLE */}

                                <div
                                    className="post-title"
                                    onClick={() =>
                                        openStory(story.id)
                                    }
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                >
                                    {story.title}
                                </div>


                                {/* EXCERPT */}

                                <div className="post-excerpt">
                                    {story.excerpt ||
                                        story.body ||
                                        'A travel story shared by the community.'}
                                </div>


                                {/* CATEGORY */}

                                <div className="post-footer">

                                    <span className="post-badge b-story">
                                        {story.category ||
                                            'Travel Story'}
                                    </span>

                                </div>


                                {/* ACTIONS */}

                                <div className="story-actions">

                                    <button
                                        className={
                                            story.liked
                                                ? 'action active'
                                                : 'action'
                                        }
                                        onClick={() =>
                                            handleLike(
                                                story.id
                                            )
                                        }
                                    >
                                        ❤️ {story.likes || 0}
                                    </button>


                                    <button
                                        className="action"
                                        onClick={() =>
                                            openStory(
                                                story.id
                                            )
                                        }
                                    >
                                        💬 {story.comments || 0}
                                    </button>


                                    <button
                                        className={
                                            story.saved
                                                ? 'action active'
                                                : 'action'
                                        }
                                        onClick={() =>
                                            handleSave(
                                                story.id
                                            )
                                        }
                                    >
                                        🔖 {story.saves || 0}
                                    </button>

                                </div>


                                {/* QUICK COMMENT */}

                                <div className="comment-box">

                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={
                                            commentText[
                                                story.id
                                            ] || ''
                                        }
                                        onChange={event =>
                                            handleCommentChange(
                                                story.id,
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={event => {
                                            if (
                                                event.key ===
                                                'Enter'
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
                                            ? '...'
                                            : 'Post'}
                                    </button>

                                </div>


                                {commentErrors[
                                    story.id
                                ] && (

                                    <p className="comment-error">
                                        {
                                            commentErrors[
                                                story.id
                                            ]
                                        }
                                    </p>

                                )}

                            </div>

                        ))

                    )}

                </div>


                {/* =====================================
                    SIDEBAR
                ====================================== */}

                <div className="home-side">

                    <div className="side-card">

                        <div className="side-title">
                            Trending in Ask
                        </div>

                        {data.questions.length === 0 ? (

                            <div className="active-label">
                                No questions available yet.
                            </div>

                        ) : (

                            data.questions.map(question => (

                                <div
                                    className="ask-item"
                                    key={question.id}
                                >

                                    <div className="ask-dot" />

                                    <div>

                                        <div className="ask-q">
                                            {question.title}
                                        </div>

                                        <div className="ask-replies">
                                            {question.replies ||
                                                0}{' '}
                                            replies
                                        </div>

                                    </div>

                                </div>

                            ))

                        )}

                    </div>


                    <div className="side-card">

                        <div className="side-title">
                            Explore by tag
                        </div>

                        <div className="tags-wrap">

                            {tags.map(tag => (

                                <span
                                    className="trend-tag"
                                    key={tag}
                                >
                                    {tag}
                                </span>

                            ))}

                        </div>

                    </div>


                    <div className="side-card">

                        <div className="side-title">
                            Active travelers
                        </div>

                        <div className="active-label">
                            Your community is powered by real
                            traveler contributions.
                        </div>

                    </div>

                </div>

            </div>


            {/* ==========================================
                STORY DETAIL MODAL
            =========================================== */}

            {selectedStory && (

                <div
                    className="story-modal-backdrop"
                    onClick={closeStory}
                >

                    <div
                        className="story-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="story-modal-close"
                            onClick={closeStory}
                        >
                            ×
                        </button>


                        {detailLoading ? (

                            <div className="stories-message">
                                Loading story...
                            </div>

                        ) : (

                            <>

                                <div className="story-modal-header">

                                    <div className="author-avatar">
                                        {selectedStory.author?.initials ||
                                            'U'}
                                    </div>

                                    <div>

                                        <strong>
                                            {selectedStory.author?.name ||
                                                selectedStory.author?.username ||
                                                'Traveler'}
                                        </strong>

                                        <div>
                                            📍{' '}
                                            {selectedStory.location ||
                                                'India'}
                                        </div>

                                    </div>

                                </div>


                                <h2>
                                    {selectedStory.title}
                                </h2>


                                <div className="story-tags">

                                    {(selectedStory.tags || []).map(
                                        tag => (
                                            <span key={tag}>
                                                {tag}
                                            </span>
                                        )
                                    )}

                                </div>


                                <div className="story-modal-body">

                                    {selectedStory.body ||
                                        selectedStory.excerpt ||
                                        'No story content available.'}

                                </div>


                                {/* MODAL ACTIONS */}

                                <div className="story-actions">

                                    <button
                                        className={
                                            selectedStory.liked
                                                ? 'action active'
                                                : 'action'
                                        }
                                        onClick={() =>
                                            handleLike(
                                                selectedStory.id
                                            )
                                        }
                                    >
                                        ❤️{' '}
                                        {selectedStory.likes ||
                                            0}
                                    </button>

                                    <button className="action">
                                        💬{' '}
                                        {selectedStory.comments?.length ||
                                            selectedStory.comments ||
                                            0}
                                    </button>

                                    <button
                                        className={
                                            selectedStory.saved
                                                ? 'action active'
                                                : 'action'
                                        }
                                        onClick={() =>
                                            handleSave(
                                                selectedStory.id
                                            )
                                        }
                                    >
                                        🔖{' '}
                                        {selectedStory.saves ||
                                            0}
                                    </button>

                                </div>


                                {/* EXISTING COMMENTS */}

                                <div className="story-comments">

                                    <h3>
                                        Comments
                                    </h3>

                                    {!selectedStory.comments ||
                                    selectedStory.comments.length ===
                                        0 ? (

                                        <div className="empty-text">
                                            No comments yet.
                                        </div>

                                    ) : (

                                        selectedStory.comments.map(
                                            comment => (

                                                <div
                                                    className="story-comment"
                                                    key={comment.id}
                                                >

                                                    <div className="author-avatar">
                                                        {comment.author?.initials ||
                                                            'U'}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {comment.author?.name ||
                                                                comment.author?.username ||
                                                                'Traveler'}
                                                        </strong>

                                                        <p>
                                                            {comment.text}
                                                        </p>

                                                    </div>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>


                                {/* NEW COMMENT */}

                                <div className="comment-box">

                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={
                                            detailComment
                                        }
                                        onChange={event =>
                                            setDetailComment(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={event => {
                                            if (
                                                event.key ===
                                                'Enter'
                                            ) {
                                                handleDetailComment();
                                            }
                                        }}
                                    />

                                    <button
                                        onClick={
                                            handleDetailComment
                                        }
                                        disabled={
                                            detailCommentLoading
                                        }
                                    >
                                        {detailCommentLoading
                                            ? '...'
                                            : 'Post'}
                                    </button>

                                </div>


                                {detailCommentError && (

                                    <p className="comment-error">
                                        {detailCommentError}
                                    </p>

                                )}

                            </>

                        )}

                    </div>

                </div>

            )}

        </Layout>
    );
}