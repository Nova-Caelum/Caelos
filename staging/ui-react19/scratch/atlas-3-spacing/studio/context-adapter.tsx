// Context adapter only. The production MultimodalInput and shared Composer are imported unchanged.
import { useState } from 'react';
import { emptyChatContext, type ChatContext } from '@/lib/chat-context';
export function useActiveChat() {
  const [conversationContext, setContext] = useState(emptyChatContext);
  const [currentModelId, setCurrentModelId] = useState('anthropic/claude-sonnet-4.5');
  return { participants: [{ id: 'hermes', name: 'Hermes' }, { id: 'athena', name: 'Athena' }], conversationContext,
    setConversationContext: (patch: Partial<ChatContext>) => setContext(c => ({ ...c, ...patch })), currentModelId, setCurrentModelId };
}
