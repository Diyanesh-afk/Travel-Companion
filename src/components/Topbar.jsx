import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '../api';

import './Topbar.css';

export default function Topbar({
    placeholder = 'Search destinations, stories, tips...'
}) {
    const [q, setQ] = useState('');
    const [user, setUser] = useState(null);

    const nav = useNavigate();

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        try {
            const response = await auth.me();

            setUser(
                response.user || null
            );
        } catch (error) {
            console.error(
                'Unable to load user:',
                error
            );

            setUser(null);
        }
    }

    const submit = (event) => {
        event.preventDefault();

        if (!q.trim()) {
            return;
        }

        nav(
            '/explore?q=' +
            encodeURIComponent(q.trim())
        );
    };

    const logout = async () => {
        try {
            await auth.logout();
        } finally {
            nav('/login');
        }
    };

    const initials =
        user?.initials ||
        user?.username
            ?.slice(0, 2)
            .toUpperCase() ||
        'U';

    return (
        <div className="topbar">

            <form
                className="search-wrap"
                onSubmit={submit}
            >
                <span className="search-icon">
                    ⌕
                </span>

                <input
                    value={q}
                    onChange={(event) =>
                        setQ(event.target.value)
                    }
                    type="text"
                    placeholder={placeholder}
                />
            </form>


            <div className="topbar-right">

                <button
                    className="notif-btn"
                    title="Notifications"
                >
                    🔔
                </button>

                <button
                    className="avatar"
                    title={
                        user?.name ||
                        user?.username ||
                        'Profile'
                    }
                    onClick={() =>
                        nav('/profile')
                    }
                >
                    {initials}
                </button>

                <button
                    className="logout-mini"
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

        </div>
    );
}