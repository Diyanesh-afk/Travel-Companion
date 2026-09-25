import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout';

import './Ask.css';

export default function NewStory() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        location: '',
        category: 'Story',
        type: 'Story',
        tags: '',
        body: ''
    });

    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function update(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }));
    }

    function handleFiles(event) {
        const selectedFiles = Array.from(
            event.target.files || []
        );

        if (!selectedFiles.length) {
            return;
        }

        const validFiles = selectedFiles.filter(file => {
            return (
                file.type.startsWith('image/') ||
                file.type.startsWith('video/')
            );
        });

        if (validFiles.length !== selectedFiles.length) {
            setError(
                'Only image and video files can be uploaded.'
            );
        } else {
            setError('');
        }

        setFiles(current => [
            ...current,
            ...validFiles
        ]);

        setPreviews(current => [
            ...current,
            ...validFiles.map(file => ({
                file,
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/')
                    ? 'video'
                    : 'image'
            }))
        ]);

        event.target.value = '';
    }

    function removeFile(index) {
        setPreviews(current => {
            const preview = current[index];

            if (preview?.url) {
                URL.revokeObjectURL(preview.url);
            }

            return current.filter(
                (_, i) => i !== index
            );
        });

        setFiles(current =>
            current.filter(
                (_, i) => i !== index
            )
        );
    }

    useEffect(() => {
        return () => {
            previews.forEach(preview => {
                if (preview.url) {
                    URL.revokeObjectURL(
                        preview.url
                    );
                }
            });
        };
    }, []);

    async function submit(event) {
        event.preventDefault();

        setError('');

        if (!form.title.trim()) {
            setError('Please enter a story title.');
            return;
        }

        if (!form.body.trim()) {
            setError('Please write your story.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            formData.append(
                'title',
                form.title.trim()
            );

            formData.append(
                'location',
                form.location.trim()
            );

            formData.append(
                'category',
                form.category
            );

            formData.append(
                'story_type',
                form.type
            );

            formData.append(
                'tags',
                form.tags
            );

            formData.append(
                'body',
                form.body.trim()
            );

            files.forEach(file => {
                formData.append(
                    'media',
                    file
                );
            });

            const API_BASE_URL =
    "https://travel-companion-coral.vercel.app";

const csrfResponse = await fetch(
    `${API_BASE_URL}/api/csrf/`,
    {
        credentials: "include",
    }
);

const csrfData = await csrfResponse.json();

if (!csrfResponse.ok) {
    throw new Error(
        csrfData.error || "Unable to get CSRF token."
    );
}

const response = await fetch(
    `${API_BASE_URL}/api/stories/`,
    {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CSRFToken": csrfData.csrfToken,
        },
        body: formData,
    }
);

const responseText = await response.text();

let data = {};

try {
    data = responseText
        ? JSON.parse(responseText)
        : {};
} catch {
    throw new Error(
        `Server returned an invalid response (${response.status}).`
    );
}

if (!response.ok) {
    throw new Error(
        data?.error ||
        data?.detail ||
        "Unable to publish story."
    );
}


            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    'Unable to publish story.'
                );
            }

            navigate('/stories');
        } catch (err) {
            console.error(
                'Story publish error:',
                err
            );

            setError(
                err.message ||
                'Unable to publish story.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <div className="ask-page">
                <div className="ask-header">
                    <div>
                        <h1>
                            Share your story
                        </h1>

                        <p>
                            Tell other travellers
                            about your experience.
                        </p>
                    </div>
                </div>

                <form
                    className="ask-form-card"
                    onSubmit={submit}
                >
                    <div className="ask-form-title">
                        New travel story
                    </div>

                    <input
                        className="ask-input"
                        placeholder="Story title"
                        value={form.title}
                        onChange={e =>
                            update(
                                'title',
                                e.target.value
                            )
                        }
                        required
                    />

                    <input
                        className="ask-input"
                        placeholder="Location (e.g. Goa)"
                        value={form.location}
                        onChange={e =>
                            update(
                                'location',
                                e.target.value
                            )
                        }
                    />

                    <div className="ask-form-row">
                        <select
                            className="ask-input"
                            value={form.type}
                            onChange={e =>
                                update(
                                    'type',
                                    e.target.value
                                )
                            }
                        >
                            <option value="Story">
                                Story
                            </option>

                            <option value="Photos">
                                Photos
                            </option>

                            <option value="Video">
                                Video
                            </option>

                            <option value="Tip">
                                Tip
                            </option>
                        </select>

                        <select
                            className="ask-input"
                            value={form.category}
                            onChange={e =>
                                update(
                                    'category',
                                    e.target.value
                                )
                            }
                        >
                            <option value="Story">
                                Story
                            </option>

                            <option value="Beach">
                                Beach
                            </option>

                            <option value="Adventure">
                                Adventure
                            </option>

                            <option value="Budget Travel">
                                Budget Travel
                            </option>

                            <option value="Road Trips">
                                Road Trips
                            </option>

                            <option value="Hikes">
                                Hikes
                            </option>

                            <option value="Food Trails">
                                Food Trails
                            </option>
                        </select>
                    </div>

                    <div className="story-upload-box">
                        <div className="story-upload-icon">
                            📸
                        </div>

                        <div className="story-upload-title">
                            Add photos or videos
                        </div>

                        <div className="story-upload-text">
                            You can select multiple
                            photos and videos.
                        </div>

                        <label className="story-upload-button">
                            Choose media
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFiles}
                            />
                        </label>
                    </div>

                    {previews.length > 0 && (
                        <div className="story-media-preview">
                            {previews.map(
                                (preview, index) => (
                                    <div
                                        className="story-media-item"
                                        key={
                                            preview.url
                                        }
                                    >
                                        {preview.type ===
                                        'video' ? (
                                            <video
                                                src={
                                                    preview.url
                                                }
                                                controls
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    preview.url
                                                }
                                                alt={
                                                    'Story media ' +
                                                    (index + 1)
                                                }
                                            />
                                        )}

                                        <button
                                            type="button"
                                            className="story-remove-media"
                                            onClick={() =>
                                                removeFile(
                                                    index
                                                )
                                            }
                                        >
                                            ×
                                        </button>

                                        <span className="story-media-type">
                                            {preview.type ===
                                            'video'
                                                ? 'VIDEO'
                                                : 'PHOTO'}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    <input
                        className="ask-input"
                        placeholder="Tags, separated by commas"
                        value={form.tags}
                        onChange={e =>
                            update(
                                'tags',
                                e.target.value
                            )
                        }
                    />

                    <textarea
                        className="ask-textarea"
                        placeholder="Write your story..."
                        value={form.body}
                        onChange={e =>
                            update(
                                'body',
                                e.target.value
                            )
                        }
                        rows={10}
                        required
                    />

                    {error && (
                        <p className="comment-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading
                            ? 'Publishing...'
                            : 'Publish story'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}