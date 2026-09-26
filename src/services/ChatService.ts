/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Conversation, ChatMessage, ActorRole, MessageType } from '../types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_MERCHANTS } from '../data/mockData';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

export class MockChatService {
  private conversations: Conversation[] = [];
  private messages: ChatMessage[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const storedConvs = loadFromStorage<Conversation[] | null>(DEMO_STORAGE_KEYS.CONVERSATIONS, null);
    if (storedConvs && Array.isArray(storedConvs) && storedConvs.length > 0) {
      this.conversations = storedConvs;
    } else {
      this.conversations = [...INITIAL_CONVERSATIONS];
      saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    }

    const storedMsgs = loadFromStorage<ChatMessage[] | null>(DEMO_STORAGE_KEYS.MESSAGES, null);
    if (storedMsgs && Array.isArray(storedMsgs) && storedMsgs.length > 0) {
      this.messages = storedMsgs;
    } else {
      this.messages = [...INITIAL_MESSAGES];
      saveToStorage(DEMO_STORAGE_KEYS.MESSAGES, this.messages);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    saveToStorage(DEMO_STORAGE_KEYS.MESSAGES, this.messages);
    this.listeners.forEach((l) => l());
  }

  getConversationsSync(): Conversation[] {
    return [...this.conversations];
  }

  getAllMessagesSync(): ChatMessage[] {
    return [...this.messages];
  }

  resetToSeedData(): { conversations: Conversation[]; messages: ChatMessage[] } {
    this.conversations = [...INITIAL_CONVERSATIONS];
    this.messages = [...INITIAL_MESSAGES];
    this.notify();
    return {
      conversations: [...this.conversations],
      messages: [...this.messages],
    };
  }

  async getConversations(): Promise<Conversation[]> {
    return [...this.conversations];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.find((c) => c.id === id);
  }

  async getConversationByOrder(orderId: string): Promise<Conversation | undefined> {
    return this.conversations.find((c) => c.orderId === orderId);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  async getOrCreateConversation(
    customerId: string,
    merchantId: string,
    orderId?: string
  ): Promise<Conversation> {
    let conv = this.conversations.find(
      (c) =>
        c.customerId === customerId &&
        c.merchantId === merchantId &&
        (!orderId || c.orderId === orderId)
    );

    if (!conv) {
      const merchant = INITIAL_MERCHANTS.find((m) => m.id === merchantId);
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        customerId,
        customerName: 'أحمد مصطفى',
        merchantId,
        merchantName: merchant?.businessName || merchant?.name || 'المتجر',
        orderId,
        createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        lastMessage: 'محادثة جديدة',
        lastMessageAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      this.conversations.unshift(newConv);
      conv = newConv;
      this.notify();
    }

    return conv;
  }

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderRole: ActorRole;
    messageType: MessageType;
    text?: string;
    imageUrl?: string;
    orderId?: string;
  }): Promise<ChatMessage> {
    const timestamp = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      messageType: params.messageType,
      text: params.text,
      imageUrl: params.imageUrl,
      timestamp,
      read: true,
      orderId: params.orderId,
    };

    this.messages.push(newMsg);

    // Update conversation last message
    const conv = this.conversations.find((c) => c.id === params.conversationId);
    if (conv) {
      conv.lastMessage =
        params.messageType === 'HANDWRITTEN_ORDER'
          ? '📝 طلب مكتوب بخط اليد'
          : params.messageType === 'IMAGE'
          ? '📷 صورة'
          : params.messageType === 'PROOF_OF_DELIVERY'
          ? '📸 إثبات تسليم POD'
          : params.text || '';
      conv.lastMessageAt = timestamp;
      if (params.orderId && !conv.orderId) {
        conv.orderId = params.orderId;
      }
    }

    this.notify();
    return newMsg;
  }
}

export const chatService = new MockChatService();
