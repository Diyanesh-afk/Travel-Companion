import {
    useEffect,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import Layout from '../components/Layout';
import { get } from '../api';
import destinationImages from '../data/destinationImages';

import './DestinationDetail.css';

export default function DestinationDetail() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [destination, setDestination] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] = useState('');
    const [related, setRelated] = useState([]);

    useEffect(() => {
        loadDestination();
    }, [id]);

    async function loadDestination() {

        try {

            setLoading(true);
            setError('');

            const response = await get(`/api/destinations/${id}/`);
            if (!response?.destination) {
                throw new Error('Destination not found.');
            }
            setDestination(response.destination);
            setRelated(response.related || []);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                'Unable to load destination.'
            );

        } finally {

            setLoading(false);

        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="destination-message">
                    Loading destination...
                </div>
            </Layout>
        );
    }

    if (error || !destination) {
        return (
            <Layout>
                <div className="destination-message">
                    {error || 'Destination not found.'}

                    <button
                        className="destination-back"
                        onClick={() =>
                            navigate('/explore')
                        }
                    >
                        Back to Explore
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>

            <div className="destination-page">

                <button
                    className="back-button"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    ← Back
                </button>

                <div
    className="destination-hero"
    style={{
        backgroundImage:
            destinationImages[destination.name]
                ? `url("${destinationImages[destination.name]}")`
                : 'none',

        backgroundSize: 'cover',
        backgroundPosition: 'center'
    }}
>
    {!destinationImages[destination.name] && (
    <span className="hero-emoji">
        {destination.emoji}
    </span>
)}

                    <div className="destination-hero-overlay">

                        <span className="destination-tag">
                            {destination.tag ||
                                'Destination'}
                        </span>

                        <h1>
                            {destination.name}
                        </h1>

                        <p>
                            📍 {destination.state}
                        </p>

                    </div>

                </div>


                <div className="destination-content">

                    <div className="destination-main">

                        <h2>
                            About {destination.name}
                        </h2>

                        <p>
                            {destination.description ||
                                `Explore ${destination.name} and discover everything this destination has to offer.`}
                        </p>


                        <h2>
                            Things to know
                        </h2>

                        <div className="destination-info-grid">

                            <div className="destination-info-card">
                                <span>⏱</span>

                                <strong>
                                    Duration
                                </strong>

                                <p>
                                    {destination.duration ||
                                        'Flexible'}
                                </p>
                            </div>


                            <div className="destination-info-card">
                                <span>💰</span>

                                <strong>
                                    Budget
                                </strong>

                                <p>
                                    {destination.budget ||
                                        'Plan according to your trip'}
                                </p>
                            </div>


                            <div className="destination-info-card">
                                <span>📍</span>

                                <strong>
                                    Location
                                </strong>

                                <p>
                                    {destination.state ||
                                        destination.name}
                                </p>
                            </div>

                        </div>


                        <h2>
                            Plan your trip
                        </h2>

                        <p>
                            Create a trip around{' '}
                            {destination.name}
                            {' '}and keep your travel
                            plans organized.
                        </p>

                        <button
                        className="plan-trip-button"
                        onClick={async () => {
                            try {
                                const response = await fetch(
                                    '/api/trips/',
                                    {
                                        method: 'POST',

                    credentials: 'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        name:
                            destination.name,

                        location:
                            destination.state ||
                            destination.name,

                        duration:
                            destination.duration ||
                            '',

                        emoji:
                            destination.emoji ||
                            '🗺️',

                        color:
                            destination.color ||
                            '#B5D4F4',

                        notes:
                            `Trip planned for ${destination.name}.`
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data?.error ||
                    'Unable to create trip.'
                );

                return;
            }


            alert(
                `${destination.name} was added to your trips!`
            );


            navigate('/profile');


        } catch (error) {

            console.error(
                'Trip creation error:',
                error
            );

            alert(
                'Unable to create trip.'
            );
        }

    }}
>
    🗺️ Plan this trip
</button>


                    </div>

                    {related.length > 0 && (
                        <div className="destination-related">
                            <h2>More places to explore</h2>
                            <div className="related-grid">
                                {related.map((item) => (
                                    <button
                                        key={item.id}
                                        className="related-card"
                                        onClick={() => navigate(`/destinations/${item.id}`)}
                                    >
                                        <span>{item.emoji}</span>
                                        <strong>{item.name}</strong>
                                        <small>{item.state || item.tag}</small>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>

        </Layout>
    );
}