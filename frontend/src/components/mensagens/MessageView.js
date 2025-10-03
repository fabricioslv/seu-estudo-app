
import React, { useRef, useEffect } from 'react';

const MessageView = ({ messages, currentUserId }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!messages || messages.length === 0) {
        return (
            <div className="message-view-container empty">
                <p>Selecione uma conversa para começar a conversar.</p>
            </div>
        );
    }

    return (
        <div className="message-view-container">
            <div className="messages-list">
                {messages.map(msg => (
                    <div 
                        key={msg.id} 
                        className={`message-bubble ${msg.remetente_id === currentUserId ? 'sent' : 'received'}`}>
                        <p>{msg.conteudo}</p>
                        <span>{new Date(msg.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};

export default MessageView;
