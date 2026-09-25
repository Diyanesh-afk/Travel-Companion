import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { get, post } from '../api';
import './Admin.css';

export default function Admin() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name:'', state:'', tag:'', emoji:'📍', color:'#9FE1CB',
        duration:'', budget:'', description:''
    });

    async function load() {
        try {
            setError('');
            setData(await get('/api/admin/overview/'));
        } catch (e) {
            setError(e.message || 'Staff access required.');
        }
    }

    useEffect(() => { load(); }, []);

    async function addDestination(e) {
        e.preventDefault();
        try {
            await post('/api/admin/destinations/', form);
            setForm({name:'',state:'',tag:'',emoji:'📍',color:'#9FE1CB',duration:'',budget:'',description:''});
            await load();
        } catch (e) { setError(e.message || 'Unable to create destination.'); }
    }

    if (error) return <Layout><div className="admin-page"><div className="admin-error">{error}</div></div></Layout>;
    if (!data) return <Layout><div className="admin-page">Loading admin dashboard...</div></Layout>;

    return (
        <Layout>
            <div className="admin-page">
                <div className="admin-header">
                    <div><h1>Admin Dashboard</h1><p>Manage the Travel Companion content and monitor platform activity.</p></div>
                </div>

                <div className="admin-stats">
                    {Object.entries(data.stats).map(([key,value]) => (
                        <div className="admin-stat" key={key}><strong>{value}</strong><span>{key}</span></div>
                    ))}
                </div>

                <div className="admin-grid">
                    <section className="admin-card">
                        <h2>Add destination</h2>
                        <form onSubmit={addDestination}>
                            {[
                                ['name','Name'],['state','State'],['tag','Category'],['emoji','Emoji'],
                                ['duration','Duration'],['budget','Budget']
                            ].map(([key,label]) => (
                                <input key={key} value={form[key]} placeholder={label}
                                    onChange={e=>setForm({...form,[key]:e.target.value})} required={key==='name'} />
                            ))}
                            <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} />
                            <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                            <button className="submit-btn">Add destination</button>
                        </form>
                    </section>

                    <section className="admin-card">
                        <h2>Recent stories</h2>
                        {data.recentStories.map(story => <div className="admin-row" key={story.id}><div><strong>{story.title}</strong><small>{story.author?.name} · {story.location || 'No location'}</small></div><span>{story.likes} ❤️</span></div>)}
                    </section>

                    <section className="admin-card">
                        <h2>Recent questions</h2>
                        {data.recentQuestions.map(q => <div className="admin-row" key={q.id}><div><strong>{q.title}</strong><small>{q.category} · {q.author?.name}</small></div><span>{q.answers} replies</span></div>)}
                    </section>
                </div>
            </div>
        </Layout>
    );
}
