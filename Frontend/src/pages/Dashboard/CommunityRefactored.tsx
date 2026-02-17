// CommunityRefactored.tsx - Refactored with service layer
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatRoomService, type ChatRoom, type ChatMessage, type SendMessageData } from '../../services/chatRoomService';
import { chatSocketService } from '../../services/chatSocketService';
import {
  FaFolderOpen,
  FaCheckCircle,
  FaSpinner,
  FaTrophy,
  FaSearch,
  FaUser,
  FaUsers,
  FaGithub,
  FaExternalLinkAlt,
  FaHeart,
  FaEye,
  FaComment,
  FaBullhorn,
  FaUserFriends,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaUserPlus,
  FaUserMinus,
  FaEnvelope,
  FaHandshake,
  FaProjectDiagram,
  FaComments,
  FaBriefcase,
  FaRocket,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaPlus,
  FaPaperclip,
  FaSmile,
  FaPaperPlane,
  FaCog,
  FaSearch as FaSearchIcon,
  FaBell
} from 'react-icons/fa';
import JobTab from '../../components/community/JobTab';
import { 
  FaCog as FaCogIcon,
  FaPaperclip as FaPaperclipIcon,
  FaSmile as FaSmileIcon,
  FaPaperPlane as FaPaperPlaneIcon
} from 'react-icons/fa';

const CommunityRefactored: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat states
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'team' | 'direct',
    maxMembers: 100
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketInitialized = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (socketInitialized.current) {
      return;
    }

    chatSocketService.connect();
    socketInitialized.current = true;

    // Setup event listeners
    chatSocketService.on('connect', () => {
      fetchChatRooms();
    });

    chatSocketService.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      socketInitialized.current = false;
    });

    chatSocketService.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      socketInitialized.current = false;
    });

    chatSocketService.on('roomsList', (rooms: ChatRoom[]) => {
      setChatRooms(rooms);
    });

    chatSocketService.on('roomJoined', (room: ChatRoom) => {
      setSelectedChatRoom(room);
      fetchMessages(room._id);
    });

    chatSocketService.on('newMessage', (message: ChatMessage) => {
      if (selectedChatRoom && message.roomId === selectedChatRoom._id) {
        setMessages(prev => [...prev, message]);
        setFilteredMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    chatSocketService.on('userTyping', (data) => {
      if (selectedChatRoom && data.roomId === selectedChatRoom._id) {
        if (data.isTyping) {
          setTypingUsers(prev => ({ ...prev, [data.userId]: data.fullName }));
        } else {
          setTypingUsers(prev => {
            const newTyping = { ...prev };
            delete newTyping[data.userId];
            return newTyping;
          });
        }
      }
    });

    // Cleanup
    return () => {
      chatSocketService.disconnect();
      socketInitialized.current = false;
    };
  }, []);

  // Fetch messages when selected room changes
  useEffect(() => {
    if (selectedChatRoom) {
      fetchMessages(selectedChatRoom._id);
    }
  }, [selectedChatRoom]);

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      const response = await chatRoomService.getChatRooms();
      setChatRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: string) => {
    try {
      const response = await chatRoomService.getRoomMessages(roomId);
      const fetchedMessages = response.data || [];
      // Reverse messages to show oldest first (newest at bottom)
      const reversedMessages = fetchedMessages.reverse();
      setMessages(reversedMessages);
      setFilteredMessages(reversedMessages);
      setSearchQuery('');
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
      setFilteredMessages([]);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100); // Small delay to ensure DOM is updated
    }
  }, [messages]);

  // Handle room selection
  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedChatRoom(room);
    setSearchQuery('');
    chatSocketService.joinRoom(room._id);
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (messageInput.trim() || uploadedFile) {
      if (selectedChatRoom) {
        try {
          const messageData: SendMessageData = {
            content: messageInput.trim(),
            roomId: selectedChatRoom._id,
            type: uploadedFile ? 'file' : 'text',
            fileName: uploadedFile?.name,
            fileSize: uploadedFile?.size
          };

          // Add message to UI immediately for sender
          const tempMessage: ChatMessage = {
            _id: `temp-${Date.now()}`,
            content: messageData.content,
            senderId: {
              _id: 'current-user',
              fullName: 'You',
              username: 'you'
            },
            roomId: selectedChatRoom._id,
            type: messageData.type || 'text',
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            createdAt: new Date().toISOString()
          };

          setMessages(prev => [...prev, tempMessage]);
          setFilteredMessages(prev => [...prev, tempMessage]);
          scrollToBottom();

          // Send via socket service
          chatSocketService.sendMessage(messageData);
          
          setMessageInput('');
          setUploadedFile(null);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (selectedChatRoom) {
      chatSocketService.startTyping();
    }
  };

  const handleTypingStop = () => {
    if (selectedChatRoom) {
      chatSocketService.stopTyping();
    }
  };

  // Handle room creation
  const handleCreateRoom = async () => {
    if (!roomForm.name.trim()) {
      alert('Room name is required');
      return;
    }

    try {
      const newRoom = await chatRoomService.createRoom(roomForm);
      
      // Add to rooms list
      setChatRooms(prev => [newRoom, ...prev]);
      
      // Reset form and close modal
      setRoomForm({
        name: '',
        description: '',
        type: 'public' as 'public' | 'private' | 'team' | 'direct',
        maxMembers: 100
      });
      setShowCreateRoomModal(false);
      
      // Join new room
      handleSelectRoom(newRoom);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }
  };

  // Filter messages based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message => 
        message.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.senderId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, searchQuery]);

  // Utility functions
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Fallback: scroll container to bottom immediately
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Immediate scroll for better UX
      scrollToBottom();
      // Also scroll after a short delay to ensure DOM is fully rendered
      setTimeout(scrollToBottom, 50);
    }
  }, [messages]);

  // Scroll to bottom immediately when component mounts with messages
  useEffect(() => {
    if (messages.length > 0 && selectedChatRoom) {
      scrollToBottom();
    }
  }, [selectedChatRoom]);

  // Mock data fetching (replace with actual API calls)
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/community/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setTeams(data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const fetchAllCommunityData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchJobs(),
        fetchMembers(),
        fetchTeams(),
        fetchChatRooms()
      ]);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCommunityData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading community data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
        
              <h1 className="text-xl font-bold text-white">Community Hub</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'projects', label: 'Projects', icon: FaFolderOpen },
              { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
              { id: 'members', label: 'Members', icon: FaUserFriends },
              { id: 'teams', label: 'Teams', icon: FaHandshake },
              { id: 'chat', label: 'Chat Rooms', icon: FaComments },
              { id: 'professional', label: 'Jobs', icon: FaBriefcase }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-12rem)]">
            <div className="flex h-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {/* Chat Rooms Sidebar */}
              <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Chat Rooms</h3>
                  <button 
                    onClick={() => setShowCreateRoomModal(true)}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FaPlus className="w-4 h-4" />
                    Create Room
                  </button>
                </div>
                
                {/* Chat Rooms List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatRooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => handleSelectRoom(room)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedChatRoom?._id === room._id
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white">{room.name}</h4>
                          <p className="text-gray-300 text-sm mt-1">{room.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            room.type === 'public' ? 'bg-green-100 text-green-800' :
                            room.type === 'private' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {room.type}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {room.members?.length || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedChatRoom ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-gray-700 border-b border-gray-600 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{selectedChatRoom.name}</h3>
                          <span className="text-gray-400 text-sm">
                            {selectedChatRoom.type} • {selectedChatRoom.members?.length || 0} members
                          </span>
                        </div>
                        <button
                          onClick={() => setShowCreateRoomModal(true)}
                          className="p-2 text-gray-400 hover:text-white transition"
                        >
                          <FaCogIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                      {filteredMessages.map((message, index) => {
                        const isCurrentUser = message.senderId?._id === 'current-user';
                        const showDate = index === 0 || new Date(message.createdAt).toDateString() !== new Date(filteredMessages[index - 1]?.createdAt).toDateString();
                        
                        return (
                          <div key={message._id}>
                            {showDate && (
                              <div className="text-center text-gray-500 text-xs my-4">
                                {new Date(message.createdAt).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                            
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'bg-purple-600' : 'bg-gray-700'} rounded-lg p-3`}>
                                {!isCurrentUser && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                      <FaUser className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-semibold text-white">{message.senderId?.fullName}</div>
                                      <div className="text-gray-400">{new Date(message.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                  </div>
                                )}
                                <p className="text-white text-sm">{message.content}</p>
                                {message.fileName && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <FaPaperclipIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300 text-sm">{message.fileName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="bg-gray-700 border-t border-gray-600 p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              handleSendMessage();
                            }
                          }}
                          onFocus={handleTypingStart}
                          onBlur={handleTypingStop}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <FaPaperPlaneIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Typing Indicator */}
                      {Object.keys(typingUsers).length > 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">
                          {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FaComments className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Select a Chat Room</h3>
                      <p className="text-gray-400">Choose a room from the sidebar to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here - projects, announcements, members, etc. */}
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Chat Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter room description (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Type</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="team">Team</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition"
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityRefactored;
