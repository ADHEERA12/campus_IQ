import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { Bot, Send, User, Sparkles, AlertCircle, Wrench } from "lucide-react";

function AIChat({ title = "🤖 campusIQ AI Assistant", subtitle = "Your intelligent school attendance assistant." }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const sendMessage = async (e) => {
        e?.preventDefault();

        if (!message.trim()) {
            return;
        }

        const userMessage = message.trim();

        setMessages((prev) => [
            ...prev,
            {
                sender: "user",
                text: userMessage,
            },
        ]);

        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/chat", {
                message: userMessage,
            });

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: response.data.message,
                    tool: response.data.tool_used,
                    data: response.data.data,
                },
            ]);
        } catch (error) {
            console.error("AI Chat Error:", error);

            const errorMessage =
                error.response?.data?.detail ||
                "Unable to connect to AI assistant.";

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: errorMessage,
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestion = (promptText) => {
        setMessage(promptText);
    };

    return (
        <div className="chat-card">
            <div className="chat-card-header">
                <div className="chat-ai-avatar">
                    <Bot size={22} />
                </div>
                <div>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
            </div>

            <div className="chat-messages-area">
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                        <div 
                            style={{ 
                                width: 56, 
                                height: 56, 
                                borderRadius: '50%', 
                                background: 'var(--primary-orange-light)', 
                                color: 'var(--primary-orange)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                marginBottom: 14 
                            }}
                        >
                            <Sparkles size={28} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--dark-navy)', marginBottom: 6 }}>How can I help you today?</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            Ask questions about attendance, required classes, or school info.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <button
                                type="button"
                                className="chip-btn"
                                onClick={() => handleSuggestion("What's my attendance?")}
                            >
                                What's my attendance?
                            </button>
                            <button
                                type="button"
                                className="chip-btn"
                                onClick={() => handleSuggestion("How many classes do I need?")}
                            >
                                How many classes do I need?
                            </button>
                            <button
                                type="button"
                                className="chip-btn"
                                onClick={() => handleSuggestion("Explain my attendance")}
                            >
                                Explain my attendance
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message-row ${msg.sender}`}
                    >
                        {msg.sender === "ai" && (
                            <div 
                                style={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: 'var(--primary-orange-light)', 
                                    color: 'var(--primary-orange)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <Bot size={18} />
                            </div>
                        )}

                        <div className={`chat-bubble ${msg.sender} ${msg.isError ? 'error-bubble' : ''}`}>
                            {msg.text}
                            {msg.tool && (
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Wrench size={12} />
                                    <span>Tool used: {msg.tool}</span>
                                </div>
                            )}
                        </div>

                        {msg.sender === "user" && (
                            <div 
                                style={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: 'var(--dark-navy)', 
                                    color: '#FFFFFF', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <User size={18} />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="chat-message-row ai">
                        <div 
                            style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                background: 'var(--primary-orange-light)', 
                                color: 'var(--primary-orange)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <Bot size={18} />
                        </div>
                        <div className="chat-bubble ai">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span className="spinner spinner-orange" style={{ width: 14, height: 14 }}></span>
                                <span>campusIQ AI is thinking...</span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Ask anything about attendance..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
                    <Send size={16} />
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
}

export default AIChat;