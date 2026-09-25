import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { get, post } from '../api';
import './Ask.css';

const categories = [
    'All',
    'Visa & Docs',
    'Budget & Costs',
    'Safety',
    'Packing',
    'Accommodation',
    'Transport'
];

export default function Ask() {
    const [active, setActive] = useState('All');
    const [items, setItems] = useState([]);

    const [show, setShow] = useState(false);

    const [form, setForm] = useState({
        title: '',
        body: '',
        category: 'Budget & Costs'
    });

    const [loading, setLoading] = useState(true);

    // Selected question for detail modal
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [detailLoading, setDetailLoading] = useState(false);

    const [answerText, setAnswerText] = useState('');

    const [answerLoading, setAnswerLoading] = useState(false);

    const [answerError, setAnswerError] = useState('');

    // ---------------------------------------------------------
    // Load questions
    // ---------------------------------------------------------

    async function load() {
        try {
            setLoading(true);

            const query =
                active === 'All'
                    ? ''
                    : `?category=${encodeURIComponent(active)}`;

            const response = await get(
                `/api/questions/${query}`
            );

            setItems(response.items || []);
        } catch (error) {
            console.error(
                'Questions loading failed:',
                error
            );

            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [active]);

    // ---------------------------------------------------------
    // Ask a new question
    // ---------------------------------------------------------

    async function submit(event) {
        event.preventDefault();

        try {
            await post(
                '/api/questions/',
                form
            );

            setForm({
                title: '',
                body: '',
                category: 'Budget & Costs'
            });

            setShow(false);

            await load();
        } catch (error) {
            alert(
                error.message ||
                'Unable to post question.'
            );
        }
    }

    // ---------------------------------------------------------
    // Open question detail
    // ---------------------------------------------------------

    async function openQuestion(questionId) {
        try {
            setDetailLoading(true);
            setAnswerError('');
            setAnswerText('');

            const response = await fetch(
                `/api/questions/${questionId}/`,
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'Unable to load question.'
                );
            }

            const question = data.question || data;

            /*
             * Django returns the answers as:
             *
             * answersList: [...]
             *
             * Normalize them to "answers" so the UI
             * has one consistent structure.
             */
            setSelectedQuestion({
                ...question,
                answers:
                    question.answersList ||
                    question.answers ||
                    question.repliesList ||
                    []
            });

        } catch (error) {
            console.error(
                'Question detail error:',
                error
            );

            setAnswerError(
                error.message ||
                'Unable to load question.'
            );
        } finally {
            setDetailLoading(false);
        }
    }

    // ---------------------------------------------------------
    // Close question detail
    // ---------------------------------------------------------

    function closeQuestion() {
        setSelectedQuestion(null);
        setAnswerText('');
        setAnswerError('');
    }

    // ---------------------------------------------------------
    // Post answer
    // ---------------------------------------------------------

    async function deleteQuestion(questionId) {
        if (!window.confirm('Delete this question and all its answers?')) return;
        try {
            const response = await fetch(`/api/questions/${questionId}/`, { method: 'DELETE', credentials: 'include' });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Unable to delete question.');
            setItems(current => current.filter(q => q.id !== questionId));
            if (selectedQuestion?.id === questionId) closeQuestion();
        } catch (error) { alert(error.message || 'Unable to delete question.'); }
    }

    async function deleteAnswer(answerId) {
        if (!window.confirm('Delete this answer?')) return;
        try {
            const response = await fetch(`/api/answers/${answerId}/`, { method: 'DELETE', credentials: 'include' });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Unable to delete answer.');
            setSelectedQuestion(current => current ? { ...current, answers: (current.answers || []).filter(a => a.id !== answerId) } : current);
            setItems(current => current.map(q => q.id === selectedQuestion?.id ? { ...q, answers: Math.max(0, (q.answers || 0) - 1) } : q));
        } catch (error) { alert(error.message || 'Unable to delete answer.'); }
    }

    async function submitAnswer() {
        const text = answerText.trim();

        if (!text) {
            setAnswerError(
                'Please write an answer first.'
            );

            return;
        }

        if (!selectedQuestion) {
            return;
        }

        try {
            setAnswerLoading(true);
            setAnswerError('');

            await post(
                `/api/questions/${selectedQuestion.id}/answers/`,
                {
                    text
                }
            );

            /*
             * Clear the input immediately.
             */
            setAnswerText('');

            /*
             * Reload the complete question.
             *
             * This is important because the backend
             * returns ALL existing answers.
             */
            await openQuestion(
                selectedQuestion.id
            );

            /*
             * Update the answer count on the
             * main question list.
             */
            setItems(currentItems =>
                currentItems.map(question =>
                    question.id === selectedQuestion.id
                        ? {
                              ...question,
                              answers:
                                  (question.answers || 0) + 1
                          }
                        : question
                )
            );

        } catch (error) {
            console.error(
                'Answer error:',
                error
            );

            setAnswerError(
                error.message ||
                'Unable to post answer.'
            );
        } finally {
            setAnswerLoading(false);
        }
    }

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    return (
        <Layout
            searchPlaceholder="Search questions, topics..."
        >

            <div className="ask-page">

                {/* HEADER */}

                <div className="ask-header">

                    <div>

                        <h1 className="page-title">
                            Ask
                        </h1>

                        <p className="page-sub">
                            Get answers from real travelers
                            who've been there.
                        </p>

                    </div>

                    <button
                        className="ask-btn"
                        onClick={() =>
                            setShow(!show)
                        }
                    >
                        {show
                            ? '✕ Cancel'
                            : '+ Ask a question'}
                    </button>

                </div>


                {/* ASK FORM */}

                {show && (

                    <form
                        className="ask-form-card"
                        onSubmit={submit}
                    >

                        <div className="ask-form-title">
                            Ask the community
                        </div>

                        <input
                            className="ask-input"
                            required
                            placeholder="Your question in one line..."
                            value={form.title}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    title:
                                        event.target.value
                                })
                            }
                        />

                        <textarea
                            className="ask-textarea"
                            rows="4"
                            required
                            placeholder="Add more detail"
                            value={form.body}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    body:
                                        event.target.value
                                })
                            }
                        />

                        <div className="ask-form-footer">

                            <select
                                className="ask-select"
                                value={form.category}
                                onChange={event =>
                                    setForm({
                                        ...form,
                                        category:
                                            event.target.value
                                    })
                                }
                            >

                                {categories
                                    .slice(1)
                                    .map(category => (

                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>

                                    ))}

                            </select>

                            <button
                                type="submit"
                                className="submit-btn"
                            >
                                Post question
                            </button>

                        </div>

                    </form>

                )}


                {/* CATEGORY FILTERS */}

                <div className="filter-bar">

                    {categories.map(category => (

                        <button
                            key={category}
                            type="button"
                            className={
                                `filter-btn ${
                                    active === category
                                        ? 'active'
                                        : ''
                                }`
                            }
                            onClick={() =>
                                setActive(category)
                            }
                        >
                            {category}
                        </button>

                    ))}

                </div>


                {/* QUESTIONS */}

                {loading ? (

                    <div className="empty-state">

                        <div className="empty-text">
                            Loading questions...
                        </div>

                    </div>

                ) : items.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-icon">
                            💬
                        </div>

                        <div className="empty-text">
                            No questions found.
                        </div>

                    </div>

                ) : (

                    <div className="questions-list">

                        {items.map(question => (

                            <div
                                className="q-card"
                                key={question.id}
                            >

                                <div className="q-top">

                                    {/* AUTHOR */}

                                    <div className="q-meta">

                                        <div
                                            className="q-avatar"
                                            style={{
                                                background:
                                                    '#0F6E56'
                                            }}
                                        >
                                            {question.author
                                                ?.initials ||
                                                'U'}
                                        </div>

                                        <div>

                                            <span className="q-author">
                                                {question.author
                                                    ?.name ||
                                                    question.author
                                                        ?.username ||
                                                    'Traveler'}
                                            </span>

                                            <span className="q-time">
                                                {' · '}

                                                {question.createdAt
                                                    ? new Date(
                                                          question.createdAt
                                                      ).toLocaleDateString()
                                                    : ''}
                                            </span>

                                        </div>

                                        <span
                                            className={
                                                `q-badge ${
                                                    question.solved
                                                        ? 'solved'
                                                        : 'open'
                                                }`
                                            }
                                        >
                                            {question.solved
                                                ? '✓ Solved'
                                                : 'Open'}
                                        </span>

                                        <span className="q-cat-pill">
                                            {question.category}
                                        </span>

                                    </div>


                                    {/* QUESTION TITLE */}

                                    <div
                                        className="q-title"
                                        onClick={() =>
                                            openQuestion(
                                                question.id
                                            )
                                        }
                                        style={{
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {question.title}
                                    </div>


                                    {/* QUESTION BODY */}

                                    <div className="q-body">
                                        {question.body}
                                    </div>

                                </div>


                                {/* FOOTER */}

                                <div className="q-footer">

                                    <span className="q-stat">
                                        💬{' '}

                                        {question.answers ||
                                            question.replies ||
                                            0}

                                        {' '}
                                        answers
                                    </span>

                                    <span className="q-stat">
                                        👁{' '}

                                        {question.views ||
                                            0}

                                        {' '}
                                        views
                                    </span>

                                    <button
                                        type="button"
                                        className="reply-btn"
                                        onClick={() =>
                                            openQuestion(
                                                question.id
                                            )
                                        }
                                    >
                                        View answers
                                    </button>
                                    {question.isOwner && (
                                        <button type="button" className="reply-btn" onClick={() => deleteQuestion(question.id)}>🗑️ Delete</button>
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* =================================================
                QUESTION DETAIL MODAL
            ================================================= */}

            {selectedQuestion && (

                <div
                    className="story-modal-backdrop"
                    onClick={closeQuestion}
                >

                    <div
                        className="story-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="story-modal-close"
                            onClick={closeQuestion}
                        >
                            ×
                        </button>


                        {detailLoading ? (

                            <div className="stories-message">
                                Loading question...
                            </div>

                        ) : (

                            <div className="story-modal-body-container">

                                {/* QUESTION AUTHOR */}

                                <div className="q-meta">

                                    <div
                                        className="q-avatar"
                                        style={{
                                            background:
                                                '#0F6E56'
                                        }}
                                    >
                                        {selectedQuestion.author
                                            ?.initials ||
                                            'U'}
                                    </div>

                                    <div>

                                        <span className="q-author">
                                            {selectedQuestion.author
                                                ?.name ||
                                                selectedQuestion.author
                                                    ?.username ||
                                                'Traveler'}
                                        </span>

                                        <div className="q-time">
                                            {selectedQuestion.createdAt
                                                ? new Date(
                                                      selectedQuestion.createdAt
                                                  ).toLocaleDateString()
                                                : ''}
                                        </div>

                                    </div>

                                </div>


                                {/* QUESTION */}

                                <h2>
                                    {selectedQuestion.title}
                                </h2>

                                <div className="q-cat-pill">
                                    {selectedQuestion.category}
                                </div>

                                {selectedQuestion.isOwner && (
                                    <button type="button" className="reply-btn" onClick={() => deleteQuestion(selectedQuestion.id)}>🗑️ Delete question</button>
                                )}

                                <div className="story-modal-body">
                                    {selectedQuestion.body ||
                                        'No additional details provided.'}
                                </div>


                                {/* ALL ANSWERS */}

                                <div className="story-comments">

                                    <h3>
                                        Answers
                                        {' '}
                                        (
                                        {selectedQuestion.answers
                                            ?.length || 0}
                                        )
                                    </h3>


                                    {selectedQuestion.answers
                                        ?.length === 0 ? (

                                        <div className="empty-text">
                                            No answers yet.
                                            Be the first to help!
                                        </div>

                                    ) : (

                                        selectedQuestion.answers.map(
                                            answer => (

                                                <div
                                                    className="story-comment"
                                                    key={answer.id}
                                                >

                                                    <div
                                                        className="author-avatar"
                                                    >
                                                        {answer.author
                                                            ?.initials ||
                                                            answer.author
                                                                ?.username
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                            'U'}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {answer.author
                                                                ?.name ||
                                                                answer.author
                                                                    ?.username ||
                                                                'Traveler'}
                                                        </strong>

                                                        <div className="q-time">
                                                            {answer.createdAt
                                                                ? new Date(
                                                                      answer.createdAt
                                                                  ).toLocaleDateString()
                                                                : ''}
                                                        </div>

                                                        <p>
                                                            {answer.text}
                                                        </p>
                                                        {answer.isOwner && (
                                                            <button type="button" className="logout-mini" onClick={() => deleteAnswer(answer.id)}>Delete</button>
                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>


                                {/* WRITE ANSWER */}

                                <div className="comment-box">

                                    <input
                                        type="text"
                                        placeholder="Write your answer..."
                                        value={answerText}
                                        onChange={event =>
                                            setAnswerText(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={event => {

                                            if (
                                                event.key ===
                                                'Enter'
                                            ) {
                                                event.preventDefault();
                                                submitAnswer();
                                            }

                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            submitAnswer
                                        }
                                        disabled={
                                            answerLoading
                                        }
                                    >
                                        {answerLoading
                                            ? 'Posting...'
                                            : 'Post'}
                                    </button>

                                </div>


                                {answerError && (

                                    <p className="comment-error">
                                        {answerError}
                                    </p>

                                )}

                            </div>

                        )}

                    </div>

                </div>

            )}

        </Layout>
    );
}