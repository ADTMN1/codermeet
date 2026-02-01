import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ThumbsUp, User, Trash2, Users, Activity, Wifi, MessageCircle, ChevronDown, ChevronUp, CornerUpLeft, CornerDownRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { messageService, Message, Reply } from '../services/messageService';
import { socketService } from '../services/socketService';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';

interface DiscussionSectionProps {
  challengeId?: string;
}

// Professional Nested Reply Component
const NestedReply = ({ 
  reply, 
  messageId, 
  user, 
  depth = 0, 
  onLike, 
  onDelete, 
  onReplyToReply, 
  replyingToReply,
  replyToReplyContent,
  setReplyToReplyContent,
  handleSubmitReplyToReply,
  handleCancelReply,
  messageService,
  getUserAvatarColor,
  getUserInitials
}: {
  reply: Reply;
  messageId: string;
  user: any;
  depth?: number;
  onLike: (messageId: string, replyId: string) => void;
  onDelete: (messageId: string, replyId: string) => void;
  onReplyToReply: (messageId: string, replyId: string, replyAuthorName: string) => void;
  replyingToReply: string | null;
  replyToReplyContent: { [key: string]: string };
  setReplyToReplyContent: (content: { [key: string]: string }) => void;
  handleSubmitReplyToReply: (messageId: string, parentReplyId: string) => void;
  handleCancelReply: () => void;
  messageService: any;
  getUserAvatarColor: (userId: string) => string;
  getUserInitials: (fullName: string) => string;
}) => {
  const isNestedReply = reply.parentReply !== null;
  const marginLeft = depth > 0 ? `${depth * 2}rem` : '0';
  const borderColor = depth > 0 ? 'border-l-2 border-blue-500/30' : 'border-l-2 border-slate-700';

  return (
    <div className={`${borderColor} pl-3 mt-2`} style={{ marginLeft }}>
      <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
        {/* Reply Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 ${getUserAvatarColor(reply.author._id)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
            {reply.author.avatar ? (
              <img src={reply.author.avatar} alt={reply.author.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              getUserInitials(reply.author.fullName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">{reply.author.fullName}</span>
              {isNestedReply && (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <CornerUpLeft className="w-3 h-3" />
                  <span>Reply</span>
                </span>
              )}
              <span className="text-xs text-slate-500">
                {reply.timeAgo || messageService.formatTimeAgo(reply.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Reply Content */}
        <p className="text-xs text-slate-400 leading-relaxed mb-2">
          {reply.content}
        </p>

        {/* Reply Actions */}
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={() => onLike(messageId, reply._id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              (reply.likes || []).includes(user?.id || '') 
                ? 'text-blue-400' 
                : 'text-slate-500 hover:text-blue-400'
            }`}
          >
            <ThumbsUp className="w-2 h-2" />
            <span>{reply.likes?.length || 0}</span>
          </button>
          <button 
            onClick={() => onReplyToReply(messageId, reply._id, reply.author.fullName)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="w-2 h-2" />
            Reply
          </button>
          {reply.author._id === user?.id && (
            <button 
              onClick={() => onDelete(messageId, reply._id)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-2 h-2" />
            </button>
          )}
        </div>

        {/* Nested Reply Form */}
        {replyingToReply === reply._id && (
          <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-slate-300">Replying to {reply.author.fullName}</span>
              <button 
                onClick={handleCancelReply}
                className="ml-auto text-xs text-slate-500 hover:text-red-400"
              >
                Cancel
              </button>
            </div>
            <Textarea
              value={replyToReplyContent[reply._id] || ''}
              onChange={(e) => {
                const newContent = { ...replyToReplyContent };
                newContent[reply._id] = e.target.value;
                setReplyToReplyContent(newContent);
              }}
              placeholder="Write your reply..."
              className="bg-slate-900 border-slate-700 text-slate-100 min-h-[50px] resize-none text-xs"
              autoFocus
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReplyToReply(messageId, reply._id)}
                disabled={!replyToReplyContent[reply._id]?.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function DiscussionSection({ challengeId }: DiscussionSectionProps) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]); // Store online user details
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToReply, setReplyingToReply] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [replyToReplyContent, setReplyToReplyContent] = useState<{ [key: string]: string }>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?._id) {
      return;
    }

    setConnectionStatus('connecting');

    // Connect to WebSocket
    socketService.connect(user._id);

    // Set up event listeners
    socketService.onNewMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.onMessageUpdated((updatedMessage: Message) => {
      setMessages(prev => 
        prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
      );
    });

    socketService.onOnlineUsers(({ count }) => {
      setOnlineCount(count);
    });

    socketService.onUserJoined(({ userId, onlineCount }) => {
      setOnlineCount(onlineCount);
      // Add user to online users list (we'll get user details from the message)
      if (userId && !onlineUsers.find(u => u._id === userId)) {
        setOnlineUsers(prev => [...prev, { _id: userId, fullName: 'New User', avatar: null }]);
      }
    });

    socketService.onUserLeft(({ userId, onlineCount }) => {
      setOnlineCount(onlineCount);
      setOnlineUsers(prev => prev.filter(u => u._id !== userId));
    });

    socketService.onUserTyping(({ userId, username, isTyping }) => {
      setTypingUsers(prev => {
        const newTypingUsers = new Set(prev);
        if (isTyping) {
          newTypingUsers.add(userId);
        } else {
          newTypingUsers.delete(userId);
        }
        return newTypingUsers;
      });
    });

    socketService.onError(({ message }) => {
      setConnectionStatus('disconnected');
      toast.error(message);
    });

    // Listen for connection events
    socketService.onConnect(() => {
      setConnectionStatus('connected');
    });

    socketService.onDisconnect(() => {
      setConnectionStatus('disconnected');
    });

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Join challenge room when challengeId changes
  useEffect(() => {
    if (!challengeId || !user?._id) {
      return;
    }

    socketService.joinChallenge(challengeId);

    // Fetch initial messages
    fetchMessages();

    return () => {
      socketService.leaveChallenge();
    };
  }, [challengeId, user]);

  // Fetch initial messages
  const fetchMessages = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      const response = await messageService.getMessages(challengeId);
      setMessages(response.data.reverse()); // Reverse to show newest at bottom
    } catch (error: any) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !challengeId) {
      return;
    }

    try {
      setSending(true);
      
      // Send via WebSocket for instant delivery
      socketService.sendMessage(newMessage.trim());
      
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLike = (messageId: string) => {
    // Send like via WebSocket
    socketService.likeMessage(messageId);
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    setReplyingToReply(null);
    setReplyContent(prev => ({ ...prev, [messageId]: '' }));
  };

  const handleReplyToReply = (messageId: string, replyId: string, replyAuthorName: string) => {
    setReplyingTo(messageId);
    setReplyingToReply(replyId);
    setReplyToReplyContent(prev => ({ ...prev, [replyId]: '' }));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingToReply(null);
    setReplyContent({});
    setReplyToReplyContent({});
  };

  const handleSubmitReply = async (messageId: string) => {
    const content = replyContent[messageId];
    if (!content?.trim()) return;

    try {
      const updatedMessage = await messageService.createReply(messageId, {
        content: content.trim()
      });

      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? updatedMessage : msg)
      );
      
      setReplyContent(prev => ({ ...prev, [messageId]: '' }));
      setReplyingTo(null);
      toast.success('Reply posted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post reply');
    }
  };

  const handleSubmitReplyToReply = async (messageId: string, parentReplyId: string) => {
    const content = replyToReplyContent[parentReplyId];
    if (!content?.trim()) return;

    try {
      const updatedMessage = await messageService.createReply(messageId, {
        content: content.trim(),
        parentReplyId: parentReplyId
      });

      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? updatedMessage : msg)
      );
      
      setReplyToReplyContent(prev => ({ ...prev, [parentReplyId]: '' }));
      setReplyingTo(null);
      setReplyingToReply(null);
      toast.success('Reply posted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post reply');
    }
  };

  const handleReplyLike = async (messageId: string, replyId: string) => {
    try {
      const updatedMessage = await messageService.toggleReplyLike(messageId, replyId);
      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? updatedMessage : msg)
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to like reply');
    }
  };

  const handleDeleteReply = async (messageId: string, replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      await messageService.deleteReply(messageId, replyId);
      setMessages(prev => 
        prev.map(msg => {
          if (msg._id === messageId) {
            return {
              ...msg,
              replies: msg.replies.filter(reply => reply._id !== replyId)
            };
          }
          return msg;
        })
      );
      toast.success('Reply deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = (messageId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const handleTyping = () => {
    socketService.startTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping();
    }, 1000);
  };

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserAvatarColor = (userId: string) => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-red-500',
      'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500'
    ];
    return colors[userId.charCodeAt(0) % colors.length];
  };

  return (
    <Card className="bg-slate-900/50 border-blue-500/20 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-blue-300">Discussion Forum</h3>
          <div className="ml-auto flex items-center gap-3">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500 animate-pulse' 
                  : connectionStatus === 'connecting' 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
              }`} />
              <span className={`text-xs ${
                connectionStatus === 'connected' 
                  ? 'text-green-400' 
                  : connectionStatus === 'connecting' 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            {/* Online Users */}
            {onlineCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  {onlineCount} {onlineCount === 1 ? 'User' : 'Users'} Online
                </span>
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((onlineUser, index) => (
                    <div
                      key={onlineUser._id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold"
                      style={{ zIndex: 3 - index }}
                    >
                      {onlineUser.avatar ? (
                        <img 
                          src={onlineUser.avatar} 
                          alt={onlineUser.fullName} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        onlineUser.fullName?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                  ))}
                  {onlineCount > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold">
                      +{onlineCount - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <span className="text-xs text-slate-500">
              {messages.length} messages
            </span>
          </div>
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 animate-pulse">
            <Activity className="w-4 h-4 text-blue-400 animate-bounce" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-blue-300 font-medium">
                {typingUsers.size === 1 ? 'Someone is typing' : `${typingUsers.size} people are typing`}
              </span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center text-slate-500 py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              return (
                <div key={msg._id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${getUserAvatarColor(msg.author._id)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                      {msg.author.avatar ? (
                        <img src={msg.author.avatar} alt={msg.author.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getUserInitials(msg.author.fullName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-200">{msg.author.fullName}</span>
                        <span className="text-xs text-slate-500">
                          {msg.timeAgo || messageService.formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => handleLike(msg._id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            (msg.likes || []).includes(user?.id || '') 
                              ? 'text-blue-400' 
                              : 'text-slate-500 hover:text-blue-400'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{msg.likes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleReply(msg._id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{msg.replies?.length || 0}</span>
                        </button>

                        {msg.author._id === user?.id && (
                          <button 
                            onClick={() => handleDelete(msg._id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyingTo === msg._id && (
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-slate-300">Replying to {msg.author.fullName}</span>
                            <button 
                              onClick={handleCancelReply}
                              className="ml-auto text-xs text-slate-500 hover:text-red-400"
                            >
                              Cancel
                            </button>
                          </div>
                          <Textarea
                            value={replyContent[msg._id] || ''}
                            onChange={(e) => setReplyContent(prev => ({ ...prev, [msg._id]: e.target.value }))}
                            placeholder="Write your reply..."
                            className="bg-slate-900 border-slate-700 text-slate-100 min-h-[60px] resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(msg._id)}
                              disabled={!replyContent[msg._id]?.trim()}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies Section */}
                      {msg.replies && msg.replies.length > 0 && (
                        <div className="mt-3 border-l-2 border-slate-700 pl-3">
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleReplies(msg._id)}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                            >
                              {expandedReplies.has(msg._id) ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              <span>
                                {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                              </span>
                            </button>
                          </div>

                          {expandedReplies.has(msg._id) && (
                            <div className="space-y-2">
                              {msg.replies.map((reply) => (
                                <NestedReply
                                  key={reply._id}
                                  reply={reply}
                                  messageId={msg._id}
                                  user={user}
                                  depth={0}
                                  onLike={handleReplyLike}
                                  onDelete={handleDeleteReply}
                                  onReplyToReply={handleReplyToReply}
                                  replyingToReply={replyingToReply}
                                  replyToReplyContent={replyToReplyContent}
                                  setReplyToReplyContent={setReplyToReplyContent}
                                  handleSubmitReplyToReply={handleSubmitReplyToReply}
                                  handleCancelReply={handleCancelReply}
                                  messageService={messageService}
                                  getUserAvatarColor={getUserAvatarColor}
                                  getUserInitials={getUserInitials}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* New Message Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={user ? "Share your thoughts, ask questions, or help others..." : "Please log in to participate in the discussion..."}
            className="bg-slate-800 border-slate-700 text-slate-100 min-h-[80px] resize-none"
            disabled={!user}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!user || !newMessage.trim() || sending}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
