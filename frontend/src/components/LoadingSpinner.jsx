import React from 'react';

function LoadingSpinner({ message = "Loading...", orange = false }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px' }}>
            <div className={`spinner ${orange ? 'spinner-orange' : ''}`}></div>
            {message && <span style={{ color: 'var(--text-muted)', fontSize: '0.925rem', fontWeight: '500' }}>{message}</span>}
        </div>
    );
}

export default LoadingSpinner;
