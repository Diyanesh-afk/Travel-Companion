import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { auth, get, put, post } from '../api';
import './Profile.css';
import './Ask.css';
import { del } from "../api";

const tabs = ['Trips', 'Stories', 'Saved', 'Following'];

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
    const [stories, setStories] = useState([]);
    const [savedStories, setSavedStories] = useState([]);

    const [active, setActive] = useState('Trips');
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [showTripForm, setShowTripForm] = useState(false);
    const [tripSaving, setTripSaving] = useState(false);
    const [tripError, setTripError] = useState('');
    const [tripForm, setTripForm] = useState({
        name: '', location: '', startDate: '', duration: '',
        emoji: '🗺️', color: '#B5D4F4', status: 'Planning', notes: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const me = await auth.me();

            setUser(me.user);
            setForm(me.user);

            const [tripData, storyData] = await Promise.all([
                get('/api/trips/'),
                get('/api/stories/')
            ]);

            setTrips(tripData.items || []);
            setStories(storyData.items || []);

            /*
             * Load saved stories separately.
             * credentials: include keeps the Django login session.
             */
            const savedResponse = await fetch(
                '/api/saved-stories/',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const savedData = await savedResponse.json();

            if (!savedResponse.ok) {
                throw new Error(
                    savedData.error || 'Unable to load saved stories.'
                );
            }

            setSavedStories(savedData.items || []);

        } catch (error) {
            console.error(
                'Profile loading failed:',
                error
            );
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile(event) {
        event.preventDefault();

        try {
            const response = await put(
                '/api/me/profile/',
                form
            );

            setUser(response.user);
            setForm(response.user);
            setEdit(false);

        } catch (error) {
            alert(error.message);
        }
    }

    async function createTrip(event) {
        event.preventDefault();
        if (!tripForm.name.trim()) {
            setTripError('Trip name is required.');
            return;
        }
        setTripSaving(true);
        setTripError('');
        try {
            const result = await post('/api/trips/', tripForm);
            setTrips(current => [result.trip, ...current]);
            setTripForm({
                name: '', location: '', startDate: '', duration: '',
                emoji: '🗺️', color: '#B5D4F4', status: 'Planning', notes: ''
            });
            setShowTripForm(false);
        } catch (error) {
            setTripError(error.message || 'Unable to create trip.');
        } finally {
            setTripSaving(false);
        }
    }
async function deleteStory(id) {
    if (!window.confirm("Delete this story? This cannot be undone.")) {
        return;
    }

    try {
        await del(`/api/stories/${id}/`);

        setStories(current =>
            current.filter(story => story.id !== id)
        );

    } catch (error) {
        alert(
            error.message ||
            "Unable to delete story."
        );
    }
}

    async function deleteTrip(id) {
        if (!window.confirm('Delete this trip?')) return;
        try {
            await del(`/api/trips/${id}/`);
            setTrips(current => current.filter(trip => trip.id !== id));
        } catch (error) {
            console.error(error);
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="empty-state">
                    <div className="empty-text">
                        Loading profile...
                    </div>
                </div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="empty-state">
                    <div className="empty-text">
                        Please log in to view your profile.
                    </div>
                </div>
            </Layout>
        );
    }

    const myStories = stories.filter(
        story => story.author?.id === user.id
    );

    return (
        <Layout searchPlaceholder="Search your trips, stories...">

            <div className="profile-page">

                {/* PROFILE HEADER */}

                <div className="profile-cover">

                    <div className="cover-bg" />

                    <div className="profile-info">

                        <div className="profile-avatar">
                            {user.initials}
                        </div>

                        <div className="profile-details">

                            <div className="profile-name">
                                {user.name}
                            </div>

                            <div className="profile-handle">
                                @{user.username} ·{' '}
                                {user.location || 'Add your location'}
                            </div>

                            <div className="profile-bio">
                                {user.bio ||
                                    'Tell the community about your travel style.'}
                            </div>

                        </div>

                        <button
                            className="edit-profile-btn"
                            onClick={() => setEdit(!edit)}
                        >
                            Edit Profile
                        </button>
                        {user.is_staff && (
                            <button className="edit-profile-btn" onClick={() => navigate('/admin-dashboard')}>
                                Admin
                            </button>
                        )}

                    </div>

                </div>


                {/* EDIT PROFILE */}

                {edit && (
                    <form
                        className="ask-form-card"
                        onSubmit={saveProfile}
                    >

                        <div className="ask-form-title">
                            Edit profile
                        </div>

                        <input
                            className="ask-input"
                            placeholder="First name"
                            value={form.first_name || ''}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    first_name: event.target.value
                                })
                            }
                        />

                        <input
                            className="ask-input"
                            placeholder="Location"
                            value={form.location || ''}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    location: event.target.value
                                })
                            }
                        />

                        <textarea
                            className="ask-textarea"
                            placeholder="Tell people about yourself..."
                            value={form.bio || ''}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    bio: event.target.value
                                })
                            }
                        />

                        <button className="submit-btn">
                            Save changes
                        </button>

                    </form>
                )}


                {/* STATS */}

                <div className="stats-row">

                    {[
                        [user.states, 'States'],
                        [user.countries, 'Countries'],
                        [user.stories, 'Stories'],
                        [user.followers, 'Followers'],
                        [user.following, 'Following']
                    ].map(([value, label]) => (

                        <div
                            className="stat-box"
                            key={label}
                        >

                            <div className="stat-val">
                                {value}
                            </div>

                            <div className="stat-label">
                                {label}
                            </div>

                        </div>

                    ))}

                </div>


                {/* ACHIEVEMENTS */}

                <div className="section-label">
                    Achievements
                </div>

                <div className="badges-row">

                    {[
                        {
                            icon: '⛰',
                            label: 'Trek Master',
                            desc: 'Explore the outdoors'
                        },
                        {
                            icon: '📸',
                            label: 'Storyteller',
                            desc: 'Share experiences'
                        },
                        {
                            icon: '💬',
                            label: 'Helper',
                            desc: 'Answer questions'
                        },
                        {
                            icon: '✈️',
                            label: 'Globetrotter',
                            desc: 'Explore countries'
                        }
                    ].map(badge => (

                        <div
                            className="badge-card"
                            key={badge.label}
                        >

                            <span className="badge-icon">
                                {badge.icon}
                            </span>

                            <div className="badge-label">
                                {badge.label}
                            </div>

                            <div className="badge-desc">
                                {badge.desc}
                            </div>

                        </div>

                    ))}

                </div>


                {/* TABS */}

                <div className="profile-tabs">

                    {tabs.map(tab => (

                        <button
                            key={tab}
                            className={`tab-btn ${
                                active === tab ? 'active' : ''
                            }`}
                            onClick={() => setActive(tab)}
                        >
                            {tab}
                        </button>

                    ))}

                </div>


                {/* TRIPS */}

                {active === 'Trips' && (
                    <>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                        <div className="section-label">Your travel plans</div>
                        <button className="submit-btn" type="button" onClick={() => setShowTripForm(v => !v)}>
                            {showTripForm ? 'Close' : '+ New trip'}
                        </button>
                    </div>

                    {showTripForm && (
                        <form className="ask-form-card" onSubmit={createTrip}>
                            <div className="ask-form-title">Create a trip</div>
                            {tripError && <div className="auth-error">{tripError}</div>}
                            <input className="ask-input" placeholder="Trip name" value={tripForm.name} onChange={e=>setTripForm({...tripForm,name:e.target.value})} required />
                            <input className="ask-input" placeholder="Location" value={tripForm.location} onChange={e=>setTripForm({...tripForm,location:e.target.value})} />
                            <div className="ask-form-row">
                                <input className="ask-input" type="date" value={tripForm.startDate} onChange={e=>setTripForm({...tripForm,startDate:e.target.value})} />
                                <input className="ask-input" placeholder="Duration (e.g. 3 days)" value={tripForm.duration} onChange={e=>setTripForm({...tripForm,duration:e.target.value})} />
                            </div>
                            <div className="ask-form-row">
                                <select className="ask-input" value={tripForm.status} onChange={e=>setTripForm({...tripForm,status:e.target.value})}>
                                    <option>Planning</option><option>Upcoming</option><option>Completed</option>
                                </select>
                                <input className="ask-input" placeholder="Emoji" value={tripForm.emoji} onChange={e=>setTripForm({...tripForm,emoji:e.target.value})} />
                            </div>
                            <textarea className="ask-textarea" placeholder="Notes" value={tripForm.notes} onChange={e=>setTripForm({...tripForm,notes:e.target.value})} />
                            <button className="submit-btn" disabled={tripSaving}>{tripSaving ? 'Creating...' : 'Create trip'}</button>
                        </form>
                    )}

                    <div className="trips-grid">

                        {trips.length === 0 ? (

                            <div className="empty-state">
                                <div className="empty-text">
                                    No trips yet.
                                </div>
                            </div>

                        ) : (

                            trips.map(trip => (

                                <div
                                    className="trip-card"
                                    key={trip.id}
                                >

                                    <div
                                        className="trip-img"
                                        style={{
                                            background:
                                                trip.color ||
                                                'linear-gradient(135deg, #667eea, #764ba2)'
                                        }}
                                    >

                                        <span className="trip-emoji">
                                            {trip.emoji}
                                        </span>

                                        <span
                                            className={`trip-status ${
                                                trip.status === 'Upcoming'
                                                    ? 'upcoming'
                                                    : 'completed'
                                            }`}
                                        >
                                            {trip.status}
                                        </span>

                                    </div>

                                    <div className="trip-body">

                                        <div className="trip-name">
                                            {trip.name}
                                        </div>

                                        <div className="trip-meta">
                                            {trip.date || 'No date'} ·{' '}
                                            {trip.duration}
                                        </div>

                                    </div>
                                    <button type="button" className="logout-mini" onClick={() => deleteTrip(trip.id)}>Delete</button>
                                </div>

                            ))

                        )}

                    </div>
                    </>
                )}


                {/* MY STORIES */}

                {active === 'Stories' && (

                    <div className="my-stories">

                        {myStories.length === 0 ? (

                            <div className="empty-state">
                                <div className="empty-text">
                                    You haven't posted any stories yet.
                                </div>
                            </div>

                        ) : (

                            myStories.map(story => (

                                <div
                                    className="my-story-row"
                                    key={story.id}
                                >

                                    <div>

                                        <div className="my-story-title">
                                            {story.title}
                                        </div>

                                        <div className="my-story-stats">

                                            <span>
                                                ❤️ {story.likes || 0}
                                            </span>

                                            <span>
                                                💬 {story.comments || 0}
                                            </span>

                                            <span>
                                                🔖 {story.saves || 0}
                                            </span>

                                        </div>

                                    </div>

                                    <span className="post-badge b-story">
                                        {story.category}
                                    </span>

                                    {story.isOwner && (
                                        <button type="button" className="logout-mini" onClick={() => deleteStory(story.id)}>Delete</button>
                                    )}

                                </div>

                            ))

                        )}

                    </div>

                )}


                {/* SAVED STORIES */}

                {active === 'Saved' && (

                    <div className="my-stories">

                        {savedStories.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-icon">
                                    🔖
                                </div>

                                <div className="empty-text">
                                    You haven't saved any stories yet.
                                </div>

                            </div>

                        ) : (

                            savedStories.map(story => (

                                <div
                                    className="my-story-row"
                                    key={story.id}
                                >

                                    <div>

                                        <div className="my-story-title">
                                            {story.title}
                                        </div>

                                        <div className="my-story-stats">

                                            <span>
                                                👤{' '}
                                                {story.author?.name ||
                                                    'Traveler'}
                                            </span>

                                            <span>
                                                ❤️ {story.likes || 0}
                                            </span>

                                            <span>
                                                💬 {story.comments || 0}
                                            </span>

                                            <span>
                                                🔖 Saved
                                            </span>

                                        </div>

                                    </div>

                                    <span className="post-badge b-story">
                                        🔖 Saved
                                    </span>

                                </div>

                            ))

                        )}

                    </div>

                )}


                {/* FOLLOWING */}

                {active === 'Following' && (

                    <div className="empty-state">

                        <div className="empty-icon">
                            👥
                        </div>

                        <div className="empty-text">
                            Follow other travelers from their profiles.
                        </div>

                    </div>

                )}

            </div>

        </Layout>
    );
}