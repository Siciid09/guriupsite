'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/app/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  X, 
  Send, 
  Loader2, 
  MoreVertical, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';

interface SharedChatProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  propertyId?: string;
  propertyTitle?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function SharedChatComponent({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName, 
  propertyId = 'general', 
  propertyTitle = 'General Inquiry' 
}: SharedChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate the exact same Chat ID as the Flutter app
  const chatId = user ? [user.uid, recipientId].sort().join('_') + '_' + propertyId : '';

  useEffect(() => {
    if (!isOpen || !user || !chatId) return;

    setLoading(true);

    // 1. Initialize Chat Document (Matches Flutter Logic)
    const initChat = async () => {
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(chatDocRef, {
        participants: [user.uid, recipientId].sort(),
        propertyId: propertyId,
        propertyTitle: propertyTitle,
        users: [user.displayName || 'User', recipientName],
        userNames: {
          [user.uid]: user.displayName || 'User',
          [recipientId]: recipientName,
        },
        lastMessageTime: serverTimestamp(),
      }, { merge: true });
    };

    initChat();

    // 2. Listen for Messages
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(fetchedMessages);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [isOpen, user, chatId, recipientId, recipientName, propertyId, propertyTitle]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      // Update last message time on main chat document
      await setDoc(doc(db, 'chats', chatId), {
        lastMessageTime: serverTimestamp(),
        lastMessage: messageText,
      }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end sm:p-4 pointer-events-none">
      {/* Backdrop for mobile */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm sm:hidden pointer-events-auto" onClick={onClose}></div>
      
      {/* Chat Window */}
      <div className="w-full sm:w-[400px] h-full sm:h-[600px] max-h-screen bg-white sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-right-8 duration-300 border border-slate-100 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0065eb] to-indigo-600 opacity-90"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 uppercase font-black">
              {recipientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1">
                {recipientName}
                <ShieldCheck size={14} className="text-green-400" />
              </h3>
              <p className="text-[10px] text-blue-100 font-medium opacity-80 uppercase tracking-widest">
                {propertyTitle.length > 25 ? propertyTitle.substring(0, 25) + '...' : propertyTitle}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-1">
            <button className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <MoreVertical size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 bg-white/5">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- SAFETY BANNER --- */}
        <div className="bg-amber-50 border-b border-amber-100 p-2.5 text-center shrink-0">
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Secure End-to-End Chat
          </p>
        </div>

        {/* --- MESSAGES AREA --- */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 custom-scrollbar">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} />
              </div>
              <h4 className="font-black text-slate-900 mb-2">Login Required</h4>
              <p className="text-sm text-slate-500 font-medium">Please log in to your account to send secure messages to this agent.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <p className="text-sm font-bold text-slate-500">No messages yet.</p>
              <p className="text-xs text-slate-400 mt-1">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid;
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Tiny Avatar for recipient */}
                    {!isMe && showAvatar && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-[10px] font-black text-slate-500 mb-1">
                        {recipientName.charAt(0)}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-6 shrink-0" />}

                    {/* Message Bubble */}
                    <div className={`
                      px-4 py-2.5 rounded-[1.25rem] shadow-sm relative text-sm
                      ${isMe 
                        ? 'bg-[#0065eb] text-white rounded-br-[4px]' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-[4px]'
                      }
                    `}>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold text-slate-400 mt-1 px-8`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- INPUT AREA --- */}
        {user && (
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <button type="button" className="p-3 text-slate-400 hover:text-[#0065eb] transition-colors rounded-xl hover:bg-slate-50 shrink-0">
                <ImageIcon size={20} />
              </button>
              
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-[#0065eb] focus-within:ring-4 focus-within:ring-[#0065eb]/10 transition-all flex items-center">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full bg-transparent border-none outline-none py-3 px-4 text-sm font-medium resize-none max-h-32 min-h-[44px] custom-scrollbar"
                  rows={1}
                />
              </div>

              <button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition-all ${newMessage.trim() ? 'bg-[#0065eb] text-white hover:bg-[#0052c1] shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'}`}
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}