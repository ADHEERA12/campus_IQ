import React from 'react';

function StatCard({ title, value, icon: Icon, subtext, statusBadge, accentColor = "var(--primary-orange)" }) {
    return (
        <div className="stat-card">
            {Icon && (
                <div 
                    className="stat-icon-wrapper" 
                    style={{ 
                        background: accentColor.includes('var') ? 'var(--primary-orange-light)' : `${accentColor}15`, 
                        color: accentColor 
                    }}
                >
                    <Icon size={26} />
                </div>
            )}
            <div className="stat-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="stat-label">{title}</span>
                    {statusBadge && statusBadge}
                </div>
                <div className="stat-value">{value}</div>
                {subtext && <div className="stat-subtext">{subtext}</div>}
            </div>
        </div>
    );
}

export default StatCard;
