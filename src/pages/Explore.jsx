import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Layout from '../components/Layout';
import { get } from '../api';

import destinationImages from '../data/destinationImages';

import './Explore.css';

const filters = [
    'All',
    'Hotels',
    'Spots',
    'Budget',
    'Fun Activities',
    'Road Trips',
    'Hikes'
];

const planTypes = [
    {
        label: 'Trip Plans',
        icon: '🗺️',
        color: '#E1F5EE',
        border: '#1D9E75',
        filter: 'All'
    },
    {
        label: 'Activities Plan',
        icon: '🧗',
        color: '#FAECE7',
        border: '#D85A30',
        filter: 'Fun Activities'
    },
    {
        label: 'Hike Plans',
        icon: '⛰️',
        color: '#C0DD97',
        border: '#3B6D11',
        filter: 'Hikes'
    },
    {
        label: 'Road Trip Plans',
        icon: '🚗',
        color: '#FAC775',
        border: '#854F0B',
        filter: 'Road Trips'
    }
];

export default function Explore() {

    const [params] = useSearchParams();
    const navigate = useNavigate();

    const searchQuery = params.get('q') || '';

    const [active, setActive] = useState('All');
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDestinations();
    }, []);

    async function loadDestinations() {

        try {
            setLoading(true);
            setError('');

            const response =
                await get('/api/destinations/');

            setPlaces(
                Array.isArray(response?.items)
                    ? response.items
                    : []
            );

        } catch (err) {

            console.error(
                'Explore error:',
                err
            );

            setError(
                'Unable to load destinations.'
            );

            setPlaces([]);

        } finally {

            setLoading(false);

        }
    }


    const filteredPlaces = places.filter(
        (place) => {

            /*
             * CATEGORY FILTER
             */

            if (active !== 'All') {

                const category = String(
                    place?.category ||
                    place?.tag ||
                    ''
                ).toLowerCase();

                const tag = String(
                    place?.tag || ''
                ).toLowerCase();

                const filter =
                    active.toLowerCase();

                const categoryMatches =
                    category.includes(filter) ||
                    tag.includes(filter);

                if (!categoryMatches) {
                    return false;
                }
            }


            /*
             * SEARCH FILTER
             */

            if (searchQuery.trim()) {

                const query =
                    searchQuery
                        .trim()
                        .toLowerCase();

                const searchableText = [

                    place?.name,

                    place?.state,

                    place?.location,

                    place?.description,

                    place?.category,

                    place?.tag,

                    place?.duration,

                    place?.budget

                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                if (
                    !searchableText.includes(query)
                ) {
                    return false;
                }
            }

            return true;
        }
    );


    const handlePlanClick = (filter) => {
        setActive(filter);
    };


    const openDestination = (id) => {

        navigate(
            `/destinations/${id}`
        );
    };


    return (
        <Layout
            searchPlaceholder={
                'Search places, activities, trips...'
            }
        >

            <div className="explore-page">


                {/* FILTER BAR */}

                <div className="filter-bar">

                    {filters.map((filter) => (

                        <button
                            key={filter}
                            type="button"
                            className={
                                'filter-btn' +
                                (
                                    active === filter
                                        ? ' active'
                                        : ''
                                )
                            }
                            onClick={() =>
                                setActive(filter)
                            }
                        >
                            {filter}
                        </button>

                    ))}

                </div>


                {/* PLAN YOUR TRIP */}

                <div className="section-label">
                    Plan your trip
                </div>


                <div className="plan-grid">

                    {planTypes.map((plan) => (

                        <button
                            key={plan.label}
                            type="button"
                            className="plan-card"
                            style={{
                                backgroundColor:
                                    plan.color,

                                borderColor:
                                    plan.border
                            }}
                            onClick={() =>
                                handlePlanClick(
                                    plan.filter
                                )
                            }
                        >

                            <span className="plan-icon">
                                {plan.icon}
                            </span>

                            <span className="plan-label">
                                {plan.label}
                            </span>

                        </button>

                    ))}

                </div>


                {/* DESTINATION TITLE */}

                <div
                    className="section-label"
                    style={{
                        marginTop: '32px'
                    }}
                >

                    {searchQuery
                        ? `Results for "${searchQuery}"`
                        : 'Destinations to explore'}

                </div>


                {/* LOADING */}

                {loading && (

                    <div className="explore-message">
                        Loading destinations...
                    </div>

                )}


                {/* ERROR */}

                {!loading && error && (

                    <div className="explore-message">
                        {error}
                    </div>

                )}


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    filteredPlaces.length === 0 && (

                        <div className="explore-message">

                            {searchQuery
                                ? `No destinations found for "${searchQuery}".`
                                : 'No destinations found.'}

                        </div>

                    )}


                {/* DESTINATION CARDS */}

                {!loading &&
                    !error &&
                    filteredPlaces.length > 0 && (

                        <div className="places-grid">

                            {filteredPlaces.map(
                                (place) => (

                                    <button
                                        type="button"
                                        className="place-card"
                                        key={place.id}
                                        onClick={() =>
                                            openDestination(
                                                place.id
                                            )
                                        }
                                    >


                                        {/* IMAGE */}

                                        <div
                                            className="place-img"
                                            style={{

                                                backgroundColor:
                                                    place?.color ||
                                                    '#E8E8E8',

                                                backgroundImage:
                                                    destinationImages[
                                                        place?.name
                                                    ]
                                                        ? `url("${destinationImages[place.name]}")`
                                                        : 'none',

                                                backgroundSize:
                                                    'cover',

                                                backgroundPosition:
                                                    'center'

                                            }}
                                        >

                                            {!destinationImages[
                                                place?.name
                                            ] && (

                                                <span className="place-emoji">
                                                    {place?.emoji ||
                                                        '📍'}
                                                </span>

                                            )}


                                            {place?.tag && (

                                                <span className="place-tag-badge">
                                                    {place.tag}
                                                </span>

                                            )}

                                        </div>


                                        {/* INFORMATION */}

                                        <div className="place-body">


                                            <div className="place-name">

                                                {place?.name ||
                                                    'Unknown destination'}

                                            </div>


                                            {place?.state && (

                                                <div className="place-state">

                                                    📍 {place.state}

                                                </div>

                                            )}


                                            {place?.description && (

                                                <div className="place-desc">

                                                    {place.description}

                                                </div>

                                            )}


                                            <div className="place-meta">


                                                {place?.duration && (

                                                    <span className="meta-pill">

                                                        ⏱ {place.duration}

                                                    </span>

                                                )}


                                                {place?.budget && (

                                                    <span className="meta-pill">

                                                        💰 {place.budget}

                                                    </span>

                                                )}

                                            </div>

                                        </div>

                                    </button>

                                )
                            )}

                        </div>

                    )}

            </div>

        </Layout>
    );
}