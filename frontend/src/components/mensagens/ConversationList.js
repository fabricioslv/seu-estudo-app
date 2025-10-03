
import React from 'react';

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
    return (
        <div className="conversations-list">
            <h2>Conversas</h2>
            <ul>
                {Object.keys(conversations).map(userId => (
                    <li 
                        key={userId} 
                        className={userId === selectedConversationId ? 'selected' : ''}
                        onClick={() => onSelectConversation(userId)}
                    >
                        {/* Idealmente, aqui teríamos o nome do usuário, não o ID */}
                        Conversa com Usuário #{userId.substring(0, 8)}...
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ConversationList;
