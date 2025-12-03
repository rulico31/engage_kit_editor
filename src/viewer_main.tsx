import React from 'react';
import ReactDOM from 'react-dom/client';
import ViewerHost from './components/ViewerHost';
import './index.css'; // Global styles

const params = new URLSearchParams(window.location.search);
const projectId = params.get('project_id');

const rootElement = document.getElementById('root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    if (projectId) {
        root.render(
            <React.StrictMode>
                <ViewerHost projectId={projectId} />
            </React.StrictMode>
        );
    } else {
        root.render(
            <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
                <h1>Error</h1>
                <p>Project ID is missing in the URL.</p>
                <p>Usage: <code>?project_id=YOUR_PROJECT_ID</code></p>
            </div>
        );
    }
}
