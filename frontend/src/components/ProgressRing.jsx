import React from 'react';

function ProgressRing({ percentage = 0, size = 160, strokeWidth = 12, label = "Attendance" }) {
    const validPercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

    const getColor = (val) => {
        if (val >= 85) return '#16A34A';
        if (val >= 75) return '#FF7A00';
        return '#DC2626';
    };

    const strokeColor = getColor(validPercentage);

    return (
        <div className="progress-ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    stroke="rgba(23, 32, 51, 0.08)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    stroke={strokeColor}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="progress-ring-text">
                <span className="progress-ring-val">{validPercentage.toFixed(1)}%</span>
                <span className="progress-ring-lbl">{label}</span>
            </div>
        </div>
    );
}

export default ProgressRing;
