import React, { useState } from "react";
import api from "../services/api";
import { Bot, Send, User } from "lucide-react";

function ChatBox() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            return;
        }

        const userMessage = message;

        setMessages((previous) => [
            ...previous,
            {
                sender: "user",
                text: userMessage
            }
        ]);

        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/chat", {
                message: userMessage
            });

            setMessages((previous) => [
                ...previous,
                {
                    sender: "ai",
                    text: response.data.message
                }
            ]);

        } catch (error) {
            console.error(error);

            setMessages((previous) => [
                ...previous,
                {
                    sender: "ai",
                    text:
                        error.response?.data?.detail ||
                        "Sorry, something went wrong."
                }
            ]);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-card">
            <div className="chat-card-header">
                <div className="chat-ai-avatar">
                    <Bot size={20} />
                </div>
                <div>
                    <h3>campusIQ AI Assistant</h3>
                    <p>Ask me about attendance and school information</p>
                </div>
            </div>

            <div className="chat-messages-area">
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h4 style={{ color: 'var(--dark-navy)', marginBottom: 6 }}>Hello 👋</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                            How can I help you today?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="chip-btn"
                                onClick={() => setMessage("What is my attendance?")}
                            >
                                What is my attendance?
                            </button>
                            <button
                                type="button"
                                className="chip-btn"
                                onClick={() => setMessage("How can I improve my attendance?")}
                            >
                                Improve my attendance
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message-row ${msg.sender}`}
                    >
                        <div className={`chat-bubble ${msg.sender}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message-row ai">
                        <div className="chat-bubble ai">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask campusIQ AI..."
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

export default ChatBox;