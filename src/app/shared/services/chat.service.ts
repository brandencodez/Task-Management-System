import { Injectable } from '@angular/core';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'employee';
  receiverId: string;
  receiverName: string;
  receiverRole: 'admin' | 'employee';
  content: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private storageKey = 'chat_messages';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Get all messages
  getAllMessages(): ChatMessage[] {
    const messages = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  }

  // Save all messages
  private saveMessages(messages: ChatMessage[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(messages));
  }

  // Send a message
  sendMessage(message: ChatMessage) {
    const messages = this.getAllMessages();
    messages.push(message);
    this.saveMessages(messages);
  }

  // Get messages between two users
  getMessagesBetween(user1Id: string, user2Id: string): ChatMessage[] {
    const messages = this.getAllMessages();
    return messages.filter(msg => 
      (msg.senderId === user1Id && msg.receiverId === user2Id) ||
      (msg.senderId === user2Id && msg.receiverId === user1Id)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Get unread count from specific sender
  getUnreadCountFrom(userId: string, senderId: string): number {
    const messages = this.getAllMessages();
    return messages.filter(msg => 
      msg.receiverId === userId && 
      msg.senderId === senderId && 
      !msg.read
    ).length;
  }

  // Get total unread count for a user
  getUnreadCount(userId: string): number {
    const messages = this.getAllMessages();
    return messages.filter(msg => 
      msg.receiverId === userId && !msg.read
    ).length;
  }

  // Mark messages as read
  markMessagesAsRead(userId: string, senderId: string) {
    const messages = this.getAllMessages();
    messages.forEach(msg => {
      if (msg.receiverId === userId && msg.senderId === senderId && !msg.read) {
        msg.read = true;
      }
    });
    this.saveMessages(messages);
  }

  // Get last message between two users
  getLastMessage(user1Id: string, user2Id: string): string {
    const messages = this.getMessagesBetween(user1Id, user2Id);
    if (messages.length === 0) return 'No messages yet';
    
    const lastMsg = messages[messages.length - 1];
    const content = lastMsg.content;
    
    return content.length > 25 
      ? content.substring(0, 25) + '...' 
      : content;
  }

  // Get last message time
  getLastMessageTime(user1Id: string, user2Id: string): Date {
    const messages = this.getMessagesBetween(user1Id, user2Id);
    if (messages.length === 0) return new Date(0);
    return messages[messages.length - 1].timestamp;
  }

  // Set current user
  setCurrentUser(userId: string, userName: string, userRole: 'admin' | 'employee') {
    localStorage.setItem('current_chat_user', JSON.stringify({
      id: userId,
      name: userName,
      role: userRole
    }));
  }

  // Get current user
  getCurrentUser(): { id: string, name: string, role: 'admin' | 'employee' } | null {
    const user = localStorage.getItem('current_chat_user');
    return user ? JSON.parse(user) : null;
  }
}