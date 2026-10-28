import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatSender = 'driver' | 'passenger';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timeLabel: string;
  read?: boolean;
}

export const CHAT_DATE_LABEL = 'Today, Oct 26, 2026';

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'driver',
    text: "Hello! I'm on my way to your pickup location.",
    timeLabel: '9:38 AM',
  },
  {
    id: 'm2',
    sender: 'passenger',
    text: "Thank you! I'm waiting near the main entrance.",
    timeLabel: '9:39 AM',
    read: true,
  },
  {
    id: 'm3',
    sender: 'driver',
    text: "Perfect. I'll be there in 3 minutes.",
    timeLabel: '9:40 AM',
  },
  {
    id: 'm4',
    sender: 'passenger',
    text: 'Okay, see you soon!',
    timeLabel: '9:40 AM',
    read: true,
  },
  {
    id: 'm5',
    sender: 'driver',
    text: "I'm at the pickup point now. I'm in the white Toyota Corolla (ABC 1234).",
    timeLabel: '9:42 AM',
  },
  {
    id: 'm6',
    sender: 'passenger',
    text: "I see you. I'm coming.",
    timeLabel: '9:42 AM',
    read: true,
  },
  {
    id: 'm7',
    sender: 'driver',
    text: 'No problem. Take your time.',
    timeLabel: '9:43 AM',
  },
];

const DRIVER_REPLIES = [
  'Got it — thanks for letting me know.',
  "I'm just around the corner, see you shortly.",
  'Perfect, I will keep an eye out for you.',
  'Understood. Drive safe and take your time.',
];

function nowLabel() {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

interface ChatStore {
  messages: ChatMessage[];
  typing: boolean;
  sendMessage: (text: string) => void;
  setTyping: (typing: boolean) => void;
  resetConversation: () => void;
}

/**
 * Local, persisted conversation with the assigned driver.
 * Survives navigating away from the messaging screen (and app restarts).
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: SEED_MESSAGES,
      typing: false,
      setTyping: (typing) => set({ typing }),
      sendMessage: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const message: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: 'passenger',
          text: trimmed,
          timeLabel: nowLabel(),
          read: false,
        };
        set({ messages: [...get().messages, message] });

        // Simulated driver reply with a typing indicator.
        setTimeout(() => set({ typing: true }), 550);
        setTimeout(() => {
          const replies = DRIVER_REPLIES;
          const reply = replies[Math.floor(Math.random() * replies.length)];
          set((state) => ({
            typing: false,
            messages: [
              ...state.messages.map((item) =>
                item.sender === 'passenger' ? { ...item, read: true } : item,
              ),
              {
                id: `msg_${Date.now()}_d`,
                sender: 'driver' as ChatSender,
                text: reply,
                timeLabel: nowLabel(),
              },
            ],
          }));
        }, 2100);
      },
      resetConversation: () => set({ messages: SEED_MESSAGES, typing: false }),
    }),
    {
      name: 'kaahiye-chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);

export default useChatStore;
