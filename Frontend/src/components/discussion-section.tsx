import React from 'react';

import { useState } from 'react';
import { MessageSquare, Send, ThumbsUp, User } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
// import { Avatar } from './ui/avatar';

export function DiscussionSection() {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'Sarah Chen',
      avatar: 'SC',
      message:
        'Anyone working on the authentication part? Would love to discuss best practices!',
      likes: 12,
      time: '2 hours ago',
      color: 'bg-purple-500',
    },
    {
      id: 2,
      author: 'Mike Johnson',
      avatar: 'MJ',
      message:
        "I'm using Firebase Auth. Works great for real-time apps. Happy to share my approach.",
      likes: 8,
      time: '1 hour ago',
      color: 'bg-blue-500',
    },
    {
      id: 3,
      author: 'Emily Rodriguez',
      avatar: 'ER',
      message:
        'Has anyone implemented typing indicators yet? Looking for some guidance.',
      likes: 5,
      time: '30 mins ago',
      color: 'bg-pink-500',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      author: 'You',
      avatar: 'YO',
      message: newMessage,
      likes: 0,
      time: 'Just now',
      color: 'bg-green-500',
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  return (
    <Card className="bg-slate-900/50 border-blue-500/20 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-blue-300">Discussion Forum</h3>
          <span className="ml-auto text-xs text-slate-500">
            {messages.length} messages
          </span>
        </div>

        {/* Messages */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* <Avatar className={`w-10 h-10 ${msg.color} flex items-center justify-center text-white`}>
                  {msg.avatar}
                </Avatar> */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-200">{msg.author}</span>
                    <span className="text-xs text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {msg.message}
                  </p>
                  <button className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{msg.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Message Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your thoughts, ask questions, or help others..."
            className="bg-slate-800 border-slate-700 text-slate-100 min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
            >
              <Send className="w-4 h-4 mr-1" />
              Post Message
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
