
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { initSocket, disconnectSocket, joinRoom, sendMessage, onReceiveMessage, offReceiveMessage } from '../../services/socketService';
import './ChatBox.css';

const ChatBox = ({ room }) => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // Inicializa o socket e se inscreve nos eventos
        initSocket();
        joinRoom(room);

        onReceiveMessage((data) => {
            setMessages(prevMessages => [...prevMessages, data]);
        });

        // Limpeza ao desmontar o componente
        return () => {
            offReceiveMessage();
            disconnectSocket();
        };
    }, [room]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && user) {
            sendMessage(room, newMessage, { id: user.id, nome: user.nome });
            setNewMessage('');
        }
    };

    return (
        <div className="chat-box-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.user.id === user.id ? 'sent' : 'received'}`}>
                        <strong>{msg.user.nome}: </strong>{msg.message}
                    </div>
                ))}
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
};

export default ChatBox;
