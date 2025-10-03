
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import messageService from '../services/messageService';
import ConversationList from '../components/mensagens/ConversationList';
import MessageView from '../components/mensagens/MessageView';
import MessageInput from '../components/mensagens/MessageInput';
import '../styles/MensagensPage.css';

const MensagensPage = () => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    useEffect(() => {
        if (user) {
            const fetchMessages = async () => {
                setLoading(true);
                try {
                    const data = await messageService.getMessages(user.id, user.token);
                    setMessages(data);
                } catch (error) {
                    console.error('Erro ao buscar mensagens:', error);
                }
                setLoading(false);
            };
            fetchMessages();
        }
    }, [user]);

    const handleSendMessage = async (content) => {
        if (!selectedConversationId) return;

        const messageData = {
            remetente_id: user.id,
            destinatario_id: selectedConversationId,
            conteudo: content,
        };

        try {
            const newMessage = await messageService.sendMessage(messageData, user.token);
            setMessages([...messages, newMessage]);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };

    const conversations = messages.reduce((acc, msg) => {
        const otherUserId = msg.remetente_id === user.id ? msg.destinatario_id : msg.remetente_id;
        if (!acc[otherUserId]) {
            acc[otherUserId] = [];
        }
        acc[otherUserId].push(msg);
        return acc;
    }, {});

    const selectedMessages = selectedConversationId ? conversations[selectedConversationId] : [];

    return (
        <div className="mensagens-page-container">
            <div className="mensagens-layout">
                <ConversationList 
                    conversations={conversations}
                    onSelectConversation={setSelectedConversationId}
                    selectedConversationId={selectedConversationId}
                />
                <div className="message-view-wrapper">
                    <MessageView 
                        messages={selectedMessages} 
                        currentUserId={user.id} 
                    />
                    {selectedConversationId && <MessageInput onSendMessage={handleSendMessage} />}
                </div>
            </div>
        </div>
    );
};

export default MensagensPage;
