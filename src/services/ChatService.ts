/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Conversation, ChatMessage, ActorRole, MessageType } from '../types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_MERCHANTS } from '../data/mockData';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

export function buildConversationId(customerId: string, merchantId: string, orderId?: string): string {
  const cleanOrder = orderId && orderId.trim() ? orderId.trim() : 'general';
  return `conv-${customerId}-${merchantId}-${cleanOrder}`;
}

export function getChatStorageKey(conversationId: string): string {
  return `tawseel_chat_msgs_${conversationId}`;
}

export class MockChatService {
  private conversations: Conversation[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const storedConvs = loadFromStorage<Conversation[] | null>(DEMO_STORAGE_KEYS.CONVERSATIONS, null);
    if (storedConvs && Array.isArray(storedConvs) && storedConvs.length > 0) {
      const convMap = new Map<string, Conversation>();
      // 1. Ensure initial demo conversations exist
      for (const init of INITIAL_CONVERSATIONS) {
        convMap.set(init.id, init);
      }
      // 2. Add stored conversations, migrating any legacy conv-1001 to Restaurant A
      for (const c of storedConvs) {
        if (!c || !c.id) continue;
        if (c.id === 'conv-1001') {
          const upgraded: Conversation = {
            ...c,
            id: 'conv-cust-1-merch-5-TW-1001',
            merchantId: 'merch-5',
            orderId: 'TW-1001',
          };
          convMap.set(upgraded.id, upgraded);
        } else {
          convMap.set(c.id, c);
        }
      }
      this.conversations = Array.from(convMap.values());
      saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    } else {
      this.conversations = [...INITIAL_CONVERSATIONS];
      saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
      // Seed storage keys for demo conversations
      for (const init of INITIAL_CONVERSATIONS) {
        const msgs = INITIAL_MESSAGES.filter((m) => m.conversationId === init.id);
        saveToStorage(getChatStorageKey(init.id), msgs);
      }
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
    this.listeners.forEach((l) => l());
  }

  getConversationsSync(): Conversation[] {
    return [...this.conversations];
  }

  getAllMessagesSync(): ChatMessage[] {
    // Collect messages across all stored conversations
    const all: ChatMessage[] = [];
    for (const conv of this.conversations) {
      const msgs = loadFromStorage<ChatMessage[] | null>(getChatStorageKey(conv.id), null);
      if (msgs && Array.isArray(msgs)) {
        all.push(...msgs);
      } else {
        const seed = INITIAL_MESSAGES.filter((m) => m.conversationId === conv.id);
        if (seed.length > 0) all.push(...seed);
      }
    }
    return all;
  }

  resetToSeedData(): { conversations: Conversation[]; messages: ChatMessage[] } {
    this.conversations = [...INITIAL_CONVERSATIONS];
    saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    const seedRestMsgs = INITIAL_MESSAGES.filter(
      (m) => m.conversationId === 'conv-cust-1-merch-5-TW-1001'
    );
    const seedPharmMsgs = INITIAL_MESSAGES.filter(
      (m) => m.conversationId === 'conv-cust-1-merch-2-general'
    );
    const seedTechMsgs = INITIAL_MESSAGES.filter(
      (m) => m.conversationId === 'conv-cust-1-merch-1-TW-8921'
    );
    saveToStorage(getChatStorageKey('conv-cust-1-merch-5-TW-1001'), seedRestMsgs);
    saveToStorage(getChatStorageKey('conv-cust-1-merch-2-general'), seedPharmMsgs);
    saveToStorage(getChatStorageKey('conv-cust-1-merch-1-TW-8921'), seedTechMsgs);
    this.notify();
    return {
      conversations: [...this.conversations],
      messages: [...INITIAL_MESSAGES],
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

  getConversationByMerchantSync(merchantId: string, customerId: string = 'cust-1'): Conversation | undefined {
    return this.conversations.find(
      (c) => c.merchantId === merchantId && c.customerId === customerId
    );
  }

  async getConversationByMerchant(
    merchantId: string,
    customerId: string = 'cust-1'
  ): Promise<Conversation | undefined> {
    return this.getConversationByMerchantSync(merchantId, customerId);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const storageKey = getChatStorageKey(conversationId);
    let msgs = loadFromStorage<ChatMessage[] | null>(storageKey, null);

    if (!msgs || !Array.isArray(msgs)) {
      // Find seed messages explicitly matching this conversationId
      const seed = INITIAL_MESSAGES.filter((m) => m.conversationId === conversationId);
      msgs = seed.length > 0 ? [...seed] : [];
      saveToStorage(storageKey, msgs);
    }

    return msgs;
  }

  updateConversationOrder(conversationId: string, orderId: string): void {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      const oldKey = getChatStorageKey(conv.id);
      const existingMessages = loadFromStorage<ChatMessage[] | null>(oldKey, null);
      conv.orderId = orderId;
      const newId = buildConversationId(conv.customerId, conv.merchantId, orderId);
      conv.id = newId;
      if (existingMessages && existingMessages.length > 0) {
        const updated = existingMessages.map((m) => ({
          ...m,
          conversationId: newId,
          orderId,
        }));
        saveToStorage(getChatStorageKey(newId), updated);
      }
      saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
      this.notify();
    }
  }

  async getOrCreateConversation(
    customerId: string,
    merchantId: string,
    orderId?: string
  ): Promise<Conversation> {
    const deterministicId = buildConversationId(customerId, merchantId, orderId);

    // 1. Check exact match by deterministic ID
    let conv = this.conversations.find((c) => c.id === deterministicId);

    // 2. Check match by customerId + merchantId
    if (!conv) {
      if (orderId) {
        // Find existing conversation for this customer & merchant that had no order or general
        conv = this.conversations.find(
          (c) =>
            c.customerId === customerId &&
            c.merchantId === merchantId &&
            (!c.orderId || c.orderId === 'general')
        );
        if (conv) {
          const oldKey = getChatStorageKey(conv.id);
          const existingMessages = loadFromStorage<ChatMessage[] | null>(oldKey, null);
          conv.orderId = orderId;
          conv.id = deterministicId;
          if (existingMessages && existingMessages.length > 0) {
            const updated = existingMessages.map((m) => ({
              ...m,
              conversationId: deterministicId,
              orderId,
            }));
            saveToStorage(getChatStorageKey(deterministicId), updated);
          }
          saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
          this.notify();
          return conv;
        }
      } else {
        conv = this.conversations.find(
          (c) => c.customerId === customerId && c.merchantId === merchantId
        );
        if (conv) {
          return conv;
        }
      }
    }

    if (conv) {
      return conv;
    }

    // 3. Create brand-new uniquely scoped conversation
    const merchant = INITIAL_MERCHANTS.find((m) => m.id === merchantId);
    const newConv: Conversation = {
      id: deterministicId,
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
    saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.notify();

    return newConv;
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

    const currentMsgs = await this.getMessages(params.conversationId);
    const updatedMsgs = [...currentMsgs, newMsg];
    saveToStorage(getChatStorageKey(params.conversationId), updatedMsgs);

    // Update conversation last message in conversations list
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
      saveToStorage(DEMO_STORAGE_KEYS.CONVERSATIONS, this.conversations);
    }

    this.notify();
    return newMsg;
  }
}

export const chatService = new MockChatService();
