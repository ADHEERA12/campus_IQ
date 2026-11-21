import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Sparkles, Menu, X } from 'lucide-react';

function Navbar({ user, title = "campusIQ AI Assistant" }) {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'student': return 'Student';
            case 'parent': return 'Parent';
            case 'teacher': return 'Teacher';
            case 'principal': return 'Principal';
            default: return role || 'User';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-brand">
                    <span className="navbar-logo-badge">campusIQ</span>
                    <span className="navbar-brand-name">
                        AI <span>Assistant</span>
                    </span>
                </div>

                <div className="navbar-user">
                    {user && (
                        <div className="user-badge-info">
                            <div className="user-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user.name || user.username}</span>
                                <span className="user-role-tag">{getRoleName(user.role)}</span>
                            </div>
                        </div>
                    )}

                    <button 
                        type="button" 
                        onClick={logout} 
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.875rem' }}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
