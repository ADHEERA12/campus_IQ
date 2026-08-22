
import { useState } from "react";
import api from "../services/api";

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
        <div className="chat-container">

            <div className="chat-header">

                <div>

                    <h4>
                        XYZ AI Assistant
                    </h4>

                    <small>
                        Ask me about attendance and school information
                    </small>

                </div>

            </div>

            <div className="messages">

                {messages.length === 0 && (

                    <div className="welcome-message">

                        <h3>
                            Hello 👋
                        </h3>

                        <p>
                            How can I help you today?
                        </p>

                        <div className="suggestions">

                            <button
                                onClick={() =>
                                    setMessage(
                                        "What is my attendance?"
                                    )
                                }
                            >
                                What is my attendance?
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "How can I improve my attendance?"
                                    )
                                }
                            >
                                Improve my attendance
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

                        <div className="message-bubble">
                            {msg.text}
                        </div>

                    </div>

                ))}

                {loading && (

                    <div className="message ai-message">

                        <div className="message-bubble">
                            Thinking...
                        </div>

                    </div>

                )}

            </div>

            <form
                className="chat-input"
                onSubmit={sendMessage}
            >

                <input
                    type="text"
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    placeholder="Ask XYZ AI..."
                />

                <button
                    type="submit"
                    disabled={loading}
                >
                    Send
                </button>

            </form>

        </div>
    );
}

export default ChatBox;