import { useState } from "react";
import api from "../services/api";

function AIChat() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();

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
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chat">

            <div className="chat-header">
                <div>
                    <h2>XYZ AI Assistant</h2>
                    <p>Ask me anything about your school information</p>
                </div>
            </div>

            <div className="chat-messages">

                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <h3>How can I help you?</h3>

                        <p>
                            Ask questions about attendance,
                            classes and school information.
                        </p>

                        <div className="suggestions">

                            <button
                                onClick={() =>
                                    setMessage("What is my attendance?")
                                }
                            >
                                What is my attendance?
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "How many classes do I need to attend to reach 75%?"
                                    )
                                }
                            >
                                Attendance goal
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Show my attendance details"
                                    )
                                }
                            >
                                Attendance details
                            </button>

                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={
                            msg.sender === "user"
                                ? "message user-message"
                                : "message ai-message"
                        }
                    >
                        <div className="message-label">
                            {msg.sender === "user"
                                ? "You"
                                : "XYZ AI"}
                        </div>

                        <div className="message-text">
                            {msg.text}
                        </div>

                        {msg.tool && (
                            <div className="tool-info">
                                AI tool used: {msg.tool}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="message ai-message">
                        <div className="message-label">
                            XYZ AI
                        </div>

                        <div className="message-text">
                            Thinking...
                        </div>
                    </div>
                )}

            </div>

            <form
                className="chat-input-area"
                onSubmit={sendMessage}
            >

                <input
                    type="text"
                    placeholder="Ask XYZ AI..."
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    disabled={loading}
                />

                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                >
                    {loading ? "..." : "Send"}
                </button>

            </form>

        </div>
    );
}

export default AIChat;