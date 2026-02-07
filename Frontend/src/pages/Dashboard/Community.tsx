import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  FaFolderOpen,
  FaCheckCircle,
  FaSpinner,
  FaTrophy,
  FaSearch,
  FaUser,
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
import { 
  FaCog as FaCogIcon,
  FaPaperclip as FaPaperclipIcon,
  FaSmile as FaSmileIcon,
  FaPaperPlane as FaPaperPlaneIcon
} from 'react-icons/fa';

interface Project {
  _id: string;
  title: string;
  description: string;
  githubUrl: string;
  liveUrl?: string;
  technologies: string[];
  userId: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  challengeSource: 'weekly' | 'daily' | 'business-competition' | 'personal';
  featured?: boolean;
  likes?: number;
  views?: number;
  comments?: number;
  isLiked?: boolean;
  status?: string;
  score?: number;
  submittedAt?: string;
  updatedAt?: string;
}

interface Comment {
  _id: string;
  comment: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  fullName: string;
  username: string;
  avatar: string;
  createdAt: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: string;
  authorId?: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  likes: number;
  comments: number;
  isLiked?: boolean;
  showComments?: boolean;
}

interface Member {
  _id: string;
  fullName: string;
  username: string;
  avatar?: string;
  bio: string;
  role: string;
  skills: string[];
  location: string;
  status: 'online' | 'busy' | 'offline';
  isMentor: boolean;
  isFriend: boolean;
  projectsCount: number;
  connectionsCount: number;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  leaderId: {
    fullName: string;
    username: string;
    avatar?: string;
  };
  members: Member[];
  maxMembers: number;
  status: 'active' | 'forming' | 'seeking-members' | 'completed';
  skillsNeeded: string[];
  expiresAt: string;
  createdAt: string;
}

interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'team' | 'direct';
  members: any[];
  maxMembers: number;
  createdAt: string;
  lastMessage?: any;
  unreadCount?: number;
}

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{id: string, type: 'project' | 'announcement'} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{id: string, name: string, avatar?: string} | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [inlineComments, setInlineComments] = useState<{[key: string]: Comment[]}>({});
  const [inlineCommentText, setInlineCommentText] = useState<{[key: string]: string}>({});
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    githubUrl: '',
    liveUrl: '',
    technologies: '',
    challengeSource: 'personal' as 'weekly' | 'daily' | 'business-competition' | 'personal',
    status: 'completed' as 'completed' | 'in-progress' | 'planned'
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    maxMembers: 5,
    skillsNeeded: '',
    expiresIn: 7 // default 7 days
  });

  // Get current user ID on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        response.then(async (response) => {
          if (response.ok) {
            const userData = await response.json();
            setCurrentUserId(userData.data._id || '');
            setCurrentUserAvatar(userData.data.avatar || '');
          }
        }).catch((error) => {
          // Error fetching user data
        });
      } catch (error) {
        // Error fetching user data
      }
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'planned':
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'in-progress':
        return <FaSpinner className="w-3 h-3" />;
      case 'planned':
        return <FaFolderOpen className="w-3 h-3" />;
      default:
        return <FaFolderOpen className="w-3 h-3" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'weekly':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'daily':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'business-competition':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'personal':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/community/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        // Mock data for development
        const mockProjects: Project[] = [
          {
            _id: '1',
            title: 'E-Commerce Platform',
            description: 'A full-stack e-commerce solution with React and Node.js',
            githubUrl: 'https://github.com/example/ecommerce',
            liveUrl: 'https://example-ecommerce.com',
            status: 'completed',
            score: 85,
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            userId: {
              _id: 'user1',
              fullName: 'John Doe',
              username: 'johndoe',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            },
            challengeSource: 'weekly',
            featured: true,
            likes: 45,
            views: 234,
            comments: 12
          },
          {
            _id: '2',
            title: 'Task Management App',
            description: 'A collaborative task management application with real-time updates',
            githubUrl: 'https://github.com/example/taskmanager',
            status: 'in-progress',
            score: 72,
            technologies: ['React', 'Socket.io', 'Express', 'PostgreSQL'],
            userId: {
              _id: 'user2',
              fullName: 'Jane Smith',
              username: 'janesmith',
            },
            challengeSource: 'daily',
            likes: 23,
            views: 156,
            comments: 8
          }
        ];
        setProjects(mockProjects);
      }
    } catch (error) {
      // Error fetching projects
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const announcements = responseJson.data || [];
        setAnnouncements(announcements);
      } else {
        // Failed to fetch announcements
        // Fallback to empty array if backend fails
        setAnnouncements([]);
      }
    } catch (error) {
      // Error fetching announcements
      // Fallback to empty array on error
      setAnnouncements([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const members = responseJson.data || [];
        setMembers(members);
      } else {
        // Failed to fetch members
        // Fallback to empty array if backend fails
        setMembers([]);
      }
    } catch (error) {
      // Error fetching members
      // Fallback to empty array on error
      setMembers([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const teams = responseJson.data || [];
        setTeams(teams);
      } else {
        // Failed to fetch teams
        // Fallback to empty array if backend fails
        setTeams([]);
      }
    } catch (error) {
      // Error fetching teams
      // Fallback to empty array on error
      setTeams([]);
    }
  };

  // Chat states
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'team' | 'direct',
    maxMembers: 100
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.emoji-picker-container')) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server with socket ID:', newSocket.id);
        fetchChatRooms();
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from chat server:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('roomsList', (rooms: ChatRoom[]) => {
        setChatRooms(rooms);
      });

      newSocket.on('roomJoined', (room: ChatRoom) => {
        setSelectedChatRoom(room);
        fetchMessages(room._id);
      });

      newSocket.on('newMessage', (message: any) => {
        console.log('📨 Received newMessage:', message);
        if (selectedChatRoom && message.roomId === selectedChatRoom._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      newSocket.on('userTyping', (data: { userId: string; fullName: string; username: string; avatar: string; isTyping: boolean; roomId: string }) => {
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

      newSocket.on('userOnline', (userId: string) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('userOffline', (userId: string) => {
        setOnlineUsers(prev => {
          const newOnline = new Set(prev);
          newOnline.delete(userId);
          return newOnline;
        });
      });

      newSocket.on('reactionAdded', (data: any) => {
        if (selectedChatRoom && data.roomId === selectedChatRoom._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, reactions: [...(msg.reactions || []), data] }
              : msg
          ));
        }
      });

      newSocket.on('messagePinned', (data: any) => {
        if (selectedChatRoom && data.roomId === selectedChatRoom._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isPinned: true }
              : msg
          ));
        }
      });

      newSocket.on('messageEdited', (data: any) => {
        if (selectedChatRoom && data.roomId === selectedChatRoom._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, content: data.content, isEdited: true, editHistory: [...(msg.editHistory || []), data] }
              : msg
          ));
        }
      });

      newSocket.on('messageDeleted', (data: any) => {
        if (selectedChatRoom && data.roomId === selectedChatRoom._id) {
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        }
      });

      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [selectedChatRoom]);

  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.data || []);
      } else {
        console.error('Failed to fetch chat rooms:', response.status, response.statusText);
        // Set empty array to prevent infinite loading
        setChatRooms([]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/chat/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        scrollToBottom();
      } else {
        console.error('Failed to fetch messages:', response.status, response.statusText);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    console.log('🏠 Selecting room:', room);
    setSelectedChatRoom(room);
    if (socket) {
      console.log('📡 Emitting joinRoom for room:', room._id);
      socket.emit('joinRoom', { roomId: room._id });
    } else {
      console.log('❌ No socket available for room join');
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() || uploadedFile) {
      if (socket && selectedChatRoom) {
        const message = {
          content: messageInput.trim(),
          roomId: selectedChatRoom._id,
          type: uploadedFile ? 'file' : 'text',
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size
        };

        console.log('📤 Sending message:', message);
        socket.emit('sendMessage', message);
        setMessageInput('');
        setUploadedFile(null);
        
        // Stop typing indicator
        handleTypingStop();
        
        // Clear typing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
      } else {
        console.log('❌ Cannot send message:', {
          hasMessage: !!messageInput.trim(),
          hasFile: !!uploadedFile,
          hasSocket: !!socket,
          hasRoom: !!selectedChatRoom
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
  '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
  '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
  '😨', '😰', '😱', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
  '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪',
  '🙏', '🤝', '✍️', '💅', '🤳', '💃', '🕺', '🗣️', '👤', '👥',
  '👣', '🚶', '🏃', '💃', '🕺', '👯', '🧖', '🗗️', '🏧', '🚻',
  '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️',
  '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞',
  '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️',
  '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔂', '🔁',
  '🔀', '🔁', '🔂', '🔃', '🔄', '🔀', '🔁', '🔂', '🔃', '🔄'
];

const emojiCategories = {
  smileys: commonEmojis.slice(0, 64),
  gestures: ['👋', '👌', '👏', '🙌', '👐', '🤲', '🙏', '✋', '🤝', '💪', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '💛', '💚', '💙', '💜'],
  symbols: ['⭐', '🌟', '✨', '💫', '🌠', '☄️', '🔥', '💥', '💢', '🌈', '🌩', '🌪', '🌫', '🌬', '🌭', '🌮', '🌯', '🌰', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃', '🍄', '🍅', '🍆', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🍔', '🍕', '🍖', '🍗', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍞', '🍟', '🍠', '🍡', '🍢', '🍣', '🍤', '🍥', '🍦', '🍧', '🍨', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍰', '🍱', '🍲', '🍳', '🍴', '🍵', '🍶', '🍷', '🍸', '🍹', '🍺', '🍻', '🍼', '🍽', '🍾', '🍿', '🎀', '🎁', '🎂', '🎃', '🎄', '🎅', '🎆', '🎇', '🎈', '🎉', '🎊', '🎋', '🎌', '🎍', '🎎', '🎏', '🎐', '🎑', '🎒', '🎓', '🎔', '🎕', '🎖', '🎗', '🎘', '🎙', '🎚', '🎛', '🎜', '🎝', '🎞', '🎟', '🎠', '🎡', '🎢', '🎣', '🎤', '🎥', '🎦', '🎧', '🎨', '🎩', '🎪', '🎭', '🎮', '🎯', '🎰', '🎱', '🎲', '🎳', '🎴', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽', '🎾', '🎿', '🏀', '🏁', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇', '🏈', '🏉', '🏊', '🏋', '🏌', '🏍', '🏎', '🏏', '🏐', '🏑', '🏒', '🏓', '🏔', '🏕', '🏖', '🏗', '🏘', '🏙', '🏚', '🏛', '🏜', '🏝', '🏞', '🏟', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯', '🏰', '🏱', '🏲', '🏳', '🏴', '🏵', '🏶', '🏷', '🏸', '🏹', '🏺', '🏻', '🏼', '🏽', '🏾', '🏿', '🐀', '🐁', '🐂', '🐃', '🐄', '🐅', '🐆', '🐇', '🐈', '🐉', '🐊', '🐋', '🐌', '🐍', '🐎', '🐏', '🐐', '🐑', '🐒', '🐓', '🐔', '🐕', '🐖', '🐗', '🐘', '🐙', '🐚', '🐛', '🐜', '🐝', '🐞', '🐟', '🐠', '🐡', '🐢', '🐣', '🐤', '🐥', '🐦', '🐧', '🐨', '🐩', '🐪', '🐫', '🐬', '🐭', '🐮', '🐯', '🐰', '🐱', '🐲', '🐳', '🐴', '🐵', '🐶', '🐷', '🐸', '🐹', '🐺', '🐻', '🐼', '🐽', '🐾', '🐿', '👀', '👁', '👂', '👃', '👄', '👅', '👆', '👇', '👈', '👉', '👊', '👋', '👌', '👍', '👎', '👏', '👐', '👑', '👒', '👓', '👔', '👕', '👖', '👗', '👘', '👙', '👚', '👛', '👜', '👝', '👞', '👟', '👠', '👡', '👢', '👣', '👤', '👥', '👦', '👧', '👨', '👩', '👪', '👫', '👬', '👭', '👮', '👯', '👰', '👱', '👲', '👳', '👴', '👵', '👶', '👷', '👸', '👹', '👺', '👻', '👽', '👾', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖']
};

  const handleTypingStart = () => {
    if (socket && selectedChatRoom) {
      socket.emit('typing', { roomId: selectedChatRoom._id, isTyping: true });
    }
  };

  const handleTypingStop = () => {
    if (socket && selectedChatRoom) {
      socket.emit('typing', { roomId: selectedChatRoom._id, isTyping: false });
    }
  };

  // Debounced typing handlers
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Start typing
    handleTypingStart();
    
    // Set timeout to stop typing after 1 second of inactivity
    const newTimeout = setTimeout(() => {
      handleTypingStop();
    }, 1000);
    
    setTypingTimeout(newTimeout);
  };

  // Handle creating chat room
  const handleCreateRoom = async () => {
    if (!roomForm.name.trim()) {
      showNotification('error', 'Room name is required');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomForm),
      });

      if (response.ok) {
        const responseJson = await response.json();
        const newRoom = responseJson.data;
        
        // Add to rooms list
        setChatRooms(prev => [newRoom, ...prev]);
        
        // Reset form and close modal
        setRoomForm({
          name: '',
          description: '',
          type: 'public',
          maxMembers: 100
        });
        setShowCreateRoomModal(false);
        
        showNotification('success', 'Chat room created successfully!');
        
        // Join the new room
        handleSelectRoom(newRoom);
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      showNotification('error', 'Error creating chat room');
    }
  };

  const handleLikeAnnouncement = async (announcementId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/announcements/${announcementId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const { likes, isLiked } = responseJson.data;
        
        setAnnouncements(prev => prev.map(announcement => 
          announcement._id === announcementId 
            ? { ...announcement, likes, isLiked }
            : announcement
        ));
      }
    } catch (error) {
      // Error liking announcement
    }
  };

  const handleCommentAnnouncement = async (announcementId: string, comment: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/announcements/${announcementId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        setAnnouncements(prev => prev.map(announcement => 
          announcement._id === announcementId 
            ? { ...announcement, comments: announcement.comments + 1 }
            : announcement
        ));
        setShowCommentModal(false);
        setCommentText('');
        setCommentTarget(null);
      }
    } catch (error) {
      // Error commenting on announcement
    }
  };

  const handleLikeProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/projects/${projectId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const { likes, isLiked } = responseJson.data;
        
        setProjects(prev => Array.isArray(prev) ? prev.map(project => 
          project._id === projectId 
            ? { ...project, likes, isLiked }
            : project
        ) : prev);
      }
    } catch (error) {
      // Error liking project
    }
  };

  const handleCommentProject = async (projectId: string, comment: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/projects/${projectId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        setProjects(prev => Array.isArray(prev) ? prev.map(project => 
          project._id === projectId 
            ? { ...project, comments: (project.comments || 0) + 1 }
            : project
        ) : prev);
        setShowCommentModal(false);
        setCommentText('');
        setCommentTarget(null);
      }
    } catch (error) {
      // Error commenting on project
    }
  };

  const fetchAnnouncementComments = async (announcementId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/announcements/${announcementId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const comments = responseJson.data || [];
        setInlineComments(prev => ({
          ...prev,
          [announcementId]: Array.isArray(comments) ? comments : []
        } as {[key: string]: Comment[]}));
      } else {
        const errorData = await response.json();
        // Error response
      }
    } catch (error) {
      // Error fetching announcement comments
    }
  };

  const toggleComments = async (announcementId: string) => {
    setAnnouncements(prev => prev.map(announcement => 
      announcement._id === announcementId 
        ? { ...announcement, showComments: !announcement.showComments }
        : announcement
    ));
    
    // Fetch comments when opening for the first time
    const announcement = announcements.find(a => a._id === announcementId);
    if (announcement && !announcement.showComments && !inlineComments[announcementId]) {
      await fetchAnnouncementComments(announcementId);
    }
  };

  const addInlineComment = async (announcementId: string, comment: string) => {
    if (comment.trim()) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/announcements/${announcementId}/comment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        });

        if (response.ok) {
          // Fetch the updated comments list to get the proper comment structure
          await fetchAnnouncementComments(announcementId);
          
          // Update announcement comment count
          setAnnouncements(prev => prev.map(announcement => 
            announcement._id === announcementId 
              ? { ...announcement, comments: announcement.comments + 1 }
              : announcement
          ));
        }
      } catch (error) {
        // Error adding inline comment
      }
    }
  };

  const openCommentModal = (id: string, type: 'project' | 'announcement') => {
    setCommentTarget({ id, type });
    setCommentText('');
    setShowCommentModal(true);
  };

  const handleCommentSubmit = () => {
    if (commentTarget && commentText.trim()) {
      if (commentTarget.type === 'project') {
        handleCommentProject(commentTarget.id, commentText);
      } else {
        handleCommentAnnouncement(commentTarget.id, commentText);
      }
    }
  };

  const handleConnectMember = async (memberId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/connect/${memberId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseJson = await response.json();
        const { isConnected } = responseJson.data;
        
        // Update the member's connection status in the UI
        setMembers(prev => prev.map(member => 
          member._id === memberId 
            ? { ...member, isFriend: isConnected }
            : member
        ));
        
        // Show success message
        showNotification('success', responseJson.message);
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Failed to update connection');
      }
    } catch (error) {
      // Error connecting to member
      showNotification('error', 'Failed to connect. Please try again.');
    }
  };

  const handleMessageMember = async (memberId: string) => {
    // Find the member details
    const member = members.find(m => m._id === memberId);
    if (member) {
      setMessageRecipient({
        id: member._id,
        name: member.fullName,
        avatar: member.avatar
      });
      setShowMessageModal(true);
      setMessageContent('');
    }
  };

  const handleSendDirectMessage = async () => {
    if (!messageRecipient || !messageContent.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/message/${messageRecipient.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent.trim() }),
      });

      if (response.ok) {
        const responseJson = await response.json();
        showNotification('success', responseJson.message);
        setShowMessageModal(false);
        setMessageRecipient(null);
        setMessageContent('');
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Failed to send message');
      }
    } catch (error) {
      // Error sending message
      showNotification('error', 'Failed to send message. Please try again.');
    }
  };

  const handlePostProject = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const technologiesArray = projectForm.technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
      
      const newProject = {
        title: projectForm.title,
        description: projectForm.description,
        githubUrl: projectForm.githubUrl,
        liveUrl: projectForm.liveUrl || undefined,
        technologies: technologiesArray,
        challengeSource: projectForm.challengeSource,
        status: projectForm.status
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProjects(prev => Array.isArray(prev) ? [createdProject, ...prev] : [createdProject]);
        setShowPostModal(false);
        setProjectForm({
          title: '',
          description: '',
          githubUrl: '',
          liveUrl: '',
          technologies: '',
          challengeSource: 'personal',
          status: 'completed'
        });
        alert('Project posted successfully!');
      } else {
        alert('Failed to post project. Please try again.');
      }
    } catch (error) {
      // Error posting project
      alert('Error posting project. Please try again.');
    }
  };

  const handleCreateTeam = async () => {
    // Validate form before submission
    if (!teamForm.name.trim()) {
      showNotification('error', 'Team name is required');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showNotification('error', 'Authentication required');
        return;
      }

      const skillsNeededArray = teamForm.skillsNeeded.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      // Calculate expiresAt date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + teamForm.expiresIn);
      
      const newTeam = {
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        maxMembers: teamForm.maxMembers,
        skillsNeeded: skillsNeededArray,
        expiresAt: expiresAt.toISOString()
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeam),
      });

      const responseData = await response.json();

      if (response.ok) {
        if (responseData.data) {
          setTeams(prev => {
            const newTeams = Array.isArray(prev) ? [responseData.data, ...prev] : [responseData.data];
            return newTeams;
          });
        }
        
        setShowCreateTeamModal(false);
        setTeamForm({
          name: '',
          description: '',
          maxMembers: 5,
          skillsNeeded: '',
          expiresIn: 7
        });
        showNotification('success', 'Team created successfully!');
      } else {
        showNotification('error', responseData.message || 'Failed to create team');
      }
    } catch (error) {
      // Error creating team
      showNotification('error', 'Error creating team. Please try again.');
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showNotification('error', 'Authentication required. Please log in.');
        return;
      }

      const team = teams.find(t => t._id === teamId);
      if (!team) {
        showNotification('error', 'Team not found.');
        return;
      }

      const isMember = team?.members?.some(member => member._id === currentUserId);
      
      // Enhanced validation using helper functions
      if (!isMember) {
        if (isTeamExpired(team.expiresAt)) {
          showNotification('error', 'This team has expired and is no longer accepting members.');
          return;
        }
        
        if ((team.members?.length || 0) >= team.maxMembers) {
          showNotification('error', 'This team is already full.');
          return;
        }
        
        if (team.status !== 'seeking-members' && team.status !== 'forming') {
          showNotification('error', 'This team is not currently accepting new members.');
          return;
        }
      }

      // Set loading state for this specific team
      setJoiningTeamId(teamId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/teams/${teamId}/${isMember ? 'leave' : 'join'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        // Show success message with action details
        const action = isMember ? 'left' : 'joined';
        showNotification('success', `Successfully ${action} team "${team.name}"!`);
        
        // Update local state immediately for real-time feedback
        setTeams(prevTeams => 
          prevTeams.map(t => {
            if (t._id === teamId) {
              if (isMember) {
                // Remove user from members
                return {
                  ...t,
                  members: t.members?.filter(member => member._id !== currentUserId) || []
                };
              } else {
                // Add user to members (create a mock member object)
                const currentUser = {
                  _id: currentUserId,
                  fullName: 'You',
                  username: 'currentuser',
                  avatar: '',
                  bio: '',
                  role: 'member',
                  skills: [],
                  location: '',
                  status: 'online' as const,
                  isMentor: false,
                  isFriend: false,
                  projectsCount: 0,
                  connectionsCount: 0
                };
                return {
                  ...t,
                  members: [...(t.members || []), currentUser]
                };
              }
            }
            return t;
          })
        );

        // Also refresh from server to ensure consistency
        setTimeout(() => {
          fetchTeams();
        }, 1000);

      } else {
        showNotification('error', responseData.message || `Failed to ${isMember ? 'leave' : 'join'} team.`);
      }
    } catch (error) {
      // Error updating team membership
      showNotification('error', 'Network error. Please check your connection and try again.');
    } finally {
      // Clear loading state
      setJoiningTeamId(null);
    }
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamDetailsModal(true);
  };

  const fetchAllCommunityData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchAnnouncements(),
        fetchMembers(),
        fetchTeams(),
        fetchChatRooms()
      ]);
    } catch (error) {
      // Error fetching community data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCommunityData();
  }, []);


  const isTeamExpired = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return expiry.getTime() <= now.getTime();
  };

  const canJoinTeam = (team: Team) => {
    return (team.status === 'seeking-members' || team.status === 'forming') && 
           !isTeamExpired(team.expiresAt) && 
           (team.members?.length || 0) < team.maxMembers;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  const formatExpirationDate = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    return expiry.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || project.challengeSource === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading community data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
        
              <h1 className="text-xl font-bold text-white">Community Hub</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
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
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-400 text-purple-400 bg-gray-700/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293a1 1 0 00-1.414-1.414L10 8.586 7.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
            
              <button 
                onClick={() => setShowPostModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Post Your Project
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search projects, users, or technologies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="planned">Planned</option>
                  </select>
               
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="bg-gray-800 p-12 rounded-xl border border-gray-700 text-center">
                <FaFolderOpen className="text-gray-500 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No community projects found</h3>
                <p className="text-gray-400 mb-6">
                  Be the first to share your project with the community!
                </p>
                <button
                 onClick={() => setShowPostModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                  Post Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10">
                            {project.userId.avatar ? (
                              <img
                                src={project.userId.avatar}
                                alt={project.userId.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold"
                              style={{ display: project.userId.avatar ? 'none' : 'flex' }}
                            >
                              {project.userId.fullName ? project.userId.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{project.userId.fullName}</p>
                            <p className="text-xs text-gray-400">@{project.userId.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status || '')}`}>
                            {getStatusIcon(project.status || '')}
                            {project.status || 'Unknown'}
                          </span>
                          {project.featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              <FaTrophy className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition">
                        {project.title}
                      </h3>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      
                      <div className="mb-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(project.challengeSource)}`}>
                          {project.challengeSource === 'weekly' ? 'Weekly Challenge' :
                           project.challengeSource === 'daily' ? 'Daily Challenge' :
                           project.challengeSource === 'business-competition' ? 'Business Competition' :
                           'Personal Project'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.slice(0, 3).map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
                            +{project.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {project.score !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <FaTrophy className="w-3 h-3" />
                              {project.score}/100
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <button
                              onClick={() => handleLikeProject(project._id)}
                              className={`flex items-center gap-1 transition ${
                                project.isLiked 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-purple-400'
                              }`}
                            >
                              <FaHeart className={`w-3 h-3 ${project.isLiked ? 'fill-current' : ''}`} />
                              {project.likes || 0}
                            </button>
                            <span className="flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              {project.views || 0}
                            </span>
                            <button
                              onClick={() => openCommentModal(project._id, 'project')}
                              className="flex items-center gap-1 hover:text-purple-400 transition"
                            >
                              <FaComment className="w-3 h-3" />
                              {project.comments || 0}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(project.githubUrl, '_blank');
                            }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                            title="View Code"
                          >
                            <FaGithub className="w-4 h-4 text-gray-300" />
                          </button>
                          {project.liveUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(project.liveUrl, '_blank');
                              }}
                              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                              title="View Live Demo"
                            >
                              <FaExternalLinkAlt className="w-4 h-4 text-gray-300" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FaBullhorn className="text-purple-400" />
                Community Announcements
              </h2>
            </div>

            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                          <FaBullhorn className="text-white w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              announcement.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              announcement.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                              'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {announcement.priority}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {announcement.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">By {announcement.authorId?.fullName || announcement.author} • {new Date(announcement.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{announcement.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {announcement.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <button
                          onClick={() => handleLikeAnnouncement(announcement._id)}
                          className={`flex items-center gap-1 transition ${
                            announcement.isLiked 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-400 hover:text-purple-400'
                          }`}
                        >
                          <FaHeart className={`w-3 h-3 ${announcement.isLiked ? 'fill-current' : ''}`} />
                          {announcement.likes}
                        </button>
                        <button
                          onClick={() => toggleComments(announcement._id)}
                          className="flex items-center gap-1 hover:text-purple-400 transition"
                        >
                          <FaComment className="w-3 h-3" />
                          {announcement.comments}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Comments Section */}
                  {announcement.showComments && (
                    <div className="border-t border-gray-700 bg-gray-750 p-4">
                      <div className="space-y-3 mb-4">
                        {(() => {
                          const comments = inlineComments[announcement._id] || [];
                          return comments.map((comment: Comment, index: number) => (
                            <div key={comment._id || `comment-${index}`} className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-start gap-3">
                                {comment.avatar ? (
                                  <img
                                    src={comment.avatar}
                                    alt={comment.fullName}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-semibold"
                                  style={{ display: comment.avatar ? 'none' : 'flex' }}
                                >
                                  {comment.fullName ? comment.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-white">{comment.fullName}</p>
                                    <p className="text-xs text-gray-400">@{comment.username}</p>
                                  </div>
                                  <p className="text-gray-300 text-sm">{comment.comment}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {comment.createdAt && !isNaN(new Date(comment.createdAt).getTime()) 
                                      ? new Date(comment.createdAt).toLocaleDateString() 
                                      : 'Recent date'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inlineCommentText[announcement._id] || ''}
                          onChange={(e) => setInlineCommentText(prev => ({
                            ...prev,
                            [announcement._id]: e.target.value
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addInlineComment(announcement._id, inlineCommentText[announcement._id] || '');
                              setInlineCommentText(prev => ({
                                ...prev,
                                [announcement._id]: ''
                              }));
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                          placeholder="Add a comment..."
                        />
                        <button
                          onClick={() => {
                            addInlineComment(announcement._id, inlineCommentText[announcement._id] || '');
                            setInlineCommentText(prev => ({
                              ...prev,
                              [announcement._id]: ''
                            }));
                          }}
                          disabled={!inlineCommentText[announcement._id]?.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition text-sm"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FaUserFriends className="w-6 h-6 text-purple-400" />
                Community Members
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">
                  {members.length} members
                </span>
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div key={member._id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500/30 transition">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.fullName}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg font-semibold"
                        style={{ display: member.avatar ? 'none' : 'flex' }}
                      >
                        {member.fullName ? member.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{member.fullName}</h3>
                        {member.isMentor && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                            Mentor
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">@{member.username}</p>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{member.bio}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3 h-3" />
                          {member.location}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{member.role}</span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {member.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
                            +{member.skills.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <FaProjectDiagram className="w-3 h-3" />
                          {member.projectsCount} projects
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUserFriends className="w-3 h-3" />
                          {member.connectionsCount} connections
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConnectMember(member._id)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            member.isFriend
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {member.isFriend ? 'Friends' : 'Connect'}
                        </button>
                        <button 
                          onClick={() => handleMessageMember(member._id)}
                          className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm">
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="text-center py-12">
                <FaUserFriends className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No members found</h3>
                <p className="text-gray-400">Be the first to join the community!</p>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
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
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatRooms.map((room) => (
                    <div
                      key={room._id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedChatRoom?._id === room._id
                          ? 'bg-purple-600/20 border border-purple-500/30'
                          : 'hover:bg-gray-700 border border-transparent'
                      }`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{room.name}</h4>
                          {room.description && (
                            <p className="text-gray-400 text-sm truncate">{room.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {room.members?.length || 0}/{room.maxMembers || 100} members
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 capitalize">{room.type}</span>
                          </div>
                        </div>
                        {room.unreadCount && room.unreadCount > 0 && (
                          <div className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {room.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages Area */}
              {selectedChatRoom ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{selectedChatRoom.name}</h2>
                        {selectedChatRoom.description && (
                          <p className="text-gray-400 text-sm">{selectedChatRoom.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-white transition">
                          <FaSearchIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white transition">
                          <FaCogIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => {
                      const isCurrentUser = message.senderId?._id === currentUserId;
                      const showDate = index === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[index - 1]?.createdAt).toDateString();
                      
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
                          
                          <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <div className="relative w-8 h-8 flex-shrink-0">
                              {isCurrentUser && currentUserAvatar ? (
                                <img
                                  src={currentUserAvatar}
                                  alt="You"
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : !isCurrentUser && message.senderId?.avatar ? (
                                <img
                                  src={message.senderId.avatar}
                                  alt={message.senderId.fullName}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium ${
                                  (isCurrentUser && currentUserAvatar) || (!isCurrentUser && message.senderId?.avatar) ? 'hidden' : ''
                                }`}
                              >
                                {isCurrentUser ? 'You' : message.senderId?.fullName?.split(' ')?.map((n: string) => n[0])?.join('').toUpperCase().slice(0, 2)}
                              </div>
                            </div>
                            <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                              <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                                <span className="text-white font-medium">
                                  {isCurrentUser ? 'You' : message.senderId?.fullName}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isCurrentUser 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-700 text-white'
                              }`}>
                                {message.type === 'file' ? (
                                  <div className="flex items-center gap-3">
                                    <FaPaperclipIcon className="w-5 h-5 text-current" />
                                    <div>
                                      <div className="font-medium">{message.fileName}</div>
                                      {message.fileSize && (
                                        <div className="text-xs opacity-75">
                                          {(message.fileSize / 1024).toFixed(1)} KB
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  message.content
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    {Object.keys(typingUsers).length > 0 && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-700 bg-gray-900">
                    {uploadedFile && (
                      <div className="mb-3 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaPaperclipIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-white text-sm">{uploadedFile.name}</span>
                          <span className="text-gray-400 text-xs">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button 
                          onClick={() => setUploadedFile(null)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-end gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        />
                        <button 
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="p-2 text-gray-400 hover:text-white transition"
                          title="Attach file"
                        >
                          <FaPaperclipIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <textarea
                          value={messageInput}
                          onChange={handleInputChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type your message..."
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                          rows={1}
                          style={{minHeight: '40px', maxHeight: '120px'}}
                        />
                      </div>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-400 hover:text-white transition"
                          title="Add emoji"
                        >
                          <FaSmileIcon className="w-5 h-5" />
                        </button>
                        
                        {showEmojiPicker && (
                          <div className="emoji-picker-container absolute bottom-12 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 w-80">
                            <div className="border-b border-gray-600 p-2">
                              <div className="text-white text-sm font-medium mb-2">Emojis</div>
                              <div className="flex gap-1 text-xs">
                                <button 
                                  onClick={() => setActiveEmojiCategory('smileys')}
                                  className={`px-2 py-1 rounded transition ${
                                    activeEmojiCategory === 'smileys' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  Smileys
                                </button>
                                <button 
                                  onClick={() => setActiveEmojiCategory('gestures')}
                                  className={`px-2 py-1 rounded transition ${
                                    activeEmojiCategory === 'gestures' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  Gestures
                                </button>
                                <button 
                                  onClick={() => setActiveEmojiCategory('hearts')}
                                  className={`px-2 py-1 rounded transition ${
                                    activeEmojiCategory === 'hearts' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  Hearts
                                </button>
                                <button 
                                  onClick={() => setActiveEmojiCategory('symbols')}
                                  className={`px-2 py-1 rounded transition ${
                                    activeEmojiCategory === 'symbols' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  Symbols
                                </button>
                              </div>
                            </div>
                            <div className="p-3 max-h-60 overflow-y-auto">
                              <div className="grid grid-cols-8 gap-1">
                                {emojiCategories[activeEmojiCategory as keyof typeof emojiCategories]?.map((emoji, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl hover:bg-gray-700 rounded p-2 transition hover:scale-110 transform"
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-gray-600 p-2 text-center">
                              <div className="text-xs text-gray-400">
                                Click any emoji to add to message
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={handleSendMessage}
                        disabled={(!messageInput.trim() && !uploadedFile) || !selectedChatRoom}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                      >
                        <FaPaperPlaneIcon className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FaComments className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Chat Room</h3>
                    <p className="text-gray-500">Choose a chat room from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Chat Room Modal */}
        {showCreateRoomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create Chat Room</h2>
                <button
                  onClick={() => setShowCreateRoomModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter room name"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-24 resize-none"
                    placeholder="Describe your room (optional)"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Room Type</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({...roomForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="team">Team</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Members</label>
                  <input
                    type="number"
                    value={roomForm.maxMembers}
                    onChange={(e) => setRoomForm({...roomForm, maxMembers: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    min="2"
                    max="1000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!roomForm.name.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FaHandshake className="w-6 h-6 text-purple-400" />
                Teams
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">
                  {teams.length} teams
                </span>
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Create Team
                </button>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {teams.map((team) => {
                return (
                <div key={team._id} className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.03]">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600/15 via-blue-600/15 to-transparent px-8 py-8 border-b border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{team.name}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-2 text-sm text-gray-400">
                            <FaUser className="w-4 h-4" />
                            {team.members?.length || 0}/{team.maxMembers}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            team.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                            team.status === 'forming' ? 'bg-blue-500/20 text-blue-300' :
                            team.status === 'seeking-members' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {team.status === 'seeking-members' ? 'OPEN' : team.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Description */}
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {team.description || 'No description provided.'}
                    </p>

                    {/* Skills */}
                    {team.skillsNeeded && team.skillsNeeded.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {team.skillsNeeded.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-lg border border-purple-500/20">
                              {skill}
                            </span>
                          ))}
                          {team.skillsNeeded.length > 3 && (
                            <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-lg">
                              +{team.skillsNeeded.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Time Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Expires: {formatExpirationDate(team.expiresAt).split(',')[0]}</span>
                      </div>
                      <p className="text-sm text-purple-400 font-medium mt-1">
                        {getTimeRemaining(team.expiresAt)}
                      </p>
                    </div>

                    {/* Leader */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {team.leaderId?.fullName ? team.leaderId.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TL'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-400 truncate">Leader</p>
                        <p className="text-sm text-white font-medium truncate">{team.leaderId?.fullName || 'Unknown'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleJoinTeam(team._id)}
                        disabled={
                          (!canJoinTeam(team) && !team.members?.some(member => member._id === currentUserId)) ||
                          joiningTeamId === team._id
                        }
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          joiningTeamId === team._id
                            ? 'bg-gray-600 text-gray-300 cursor-wait'
                            : team.members?.some(member => member._id === currentUserId)
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 shadow-md'
                            : canJoinTeam(team)
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {joiningTeamId === team._id ? (
                            <>
                              <FaSpinner className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : team.members?.some(member => member._id === currentUserId) ? (
                            <>
                              <FaUserMinus className="w-4 h-4" />
                              Leave
                            </>
                          ) : canJoinTeam(team) ? (
                            <>
                              <FaUserPlus className="w-4 h-4" />
                              Join
                            </>
                          ) : isTeamExpired(team.expiresAt) ? (
                            <>
                              <FaCalendarAlt className="w-4 h-4" />
                              Expired
                            </>
                          ) : (team.members?.length || 0) >= team.maxMembers ? (
                            <>
                              <FaUser className="w-4 h-4" />
                              Full
                            </>
                          ) : (
                            <>
                              <FaUser className="w-4 h-4" />
                              Closed
                            </>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={() => handleViewTeam(team)}
                        className="px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 rounded-lg hover:from-slate-600 hover:to-slate-500 transition-all duration-200 text-sm font-medium transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          <FaEye className="w-4 h-4" />
                          View Details
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {teams.length === 0 && (
              <div className="text-center py-12">
                <FaHandshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
                <p className="text-gray-400">Create your first team to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Post Project Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Post Your Project</h2>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-32 resize-none"
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                    <input
                      type="url"
                      value={projectForm.githubUrl}
                      onChange={(e) => setProjectForm({...projectForm, githubUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Live URL (Optional)</label>
                    <input
                      type="url"
                      value={projectForm.liveUrl}
                      onChange={(e) => setProjectForm({...projectForm, liveUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="https://yourproject.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Technologies (comma-separated)</label>
                  <input
                    type="text"
                    value={projectForm.technologies}
                    onChange={(e) => setProjectForm({...projectForm, technologies: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="React, Node.js, MongoDB, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Source</label>
                    <select
                      value={projectForm.challengeSource}
                      onChange={(e) => setProjectForm({...projectForm, challengeSource: e.target.value as any})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="personal">Personal Project</option>
                      <option value="weekly">Weekly Challenge</option>
                      <option value="daily">Daily Challenge</option>
                      <option value="business-competition">Business Competition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({...projectForm, status: e.target.value as any})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostProject}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                  >
                    Post Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {commentTarget?.type === 'project' ? 'Comment on Project' : 'Comment on Announcement'}
                </h3>
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setCommentText('');
                    setCommentTarget(null);
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Comment</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-32 resize-none"
                    placeholder="Share your thoughts..."
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowCommentModal(false);
                      setCommentText('');
                      setCommentTarget(null);
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && messageRecipient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  {messageRecipient.avatar ? (
                    <img
                      src={messageRecipient.avatar}
                      alt={messageRecipient.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ display: messageRecipient.avatar ? 'none' : 'flex' }}
                  >
                    {messageRecipient.name ? messageRecipient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Message to {messageRecipient.name}</h3>
                  <p className="text-sm text-gray-400">Send a private message</p>
                </div>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageRecipient(null);
                    setMessageContent('');
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-32 resize-none"
                  placeholder="Type your message here..."
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageRecipient(null);
                    setMessageContent('');
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendDirectMessage}
                  disabled={!messageContent.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Team</h3>
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamForm({
                    name: '',
                    description: '',
                    maxMembers: 5,
                    skillsNeeded: '',
                    expiresIn: 7
                  });
                }}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter team name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 h-24 resize-none"
                  placeholder="Describe your team..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Members</label>
                <select
                  value={teamForm.maxMembers}
                  onChange={(e) => setTeamForm({...teamForm, maxMembers: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="3">3 members</option>
                  <option value="5">5 members</option>
                  <option value="10">10 members</option>
                  <option value="15">15 members</option>
                  <option value="20">20 members</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team Available For</label>
                <select
                  value={teamForm.expiresIn}
                  onChange={(e) => setTeamForm({...teamForm, expiresIn: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Skills Needed</label>
                <input
                  type="text"
                  value={teamForm.skillsNeeded}
                  onChange={(e) => setTeamForm({...teamForm, skillsNeeded: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="React, TypeScript, Node.js, CSS..."
                />
                <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamForm({
                    name: '',
                    description: '',
                    maxMembers: 5,
                    skillsNeeded: '',
                    expiresIn: 7
                  });
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!teamForm.name.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamDetailsModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-8 py-6 border-b border-gray-700 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {selectedTeam.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTeam.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTeam.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                        selectedTeam.status === 'forming' ? 'bg-blue-500/20 text-blue-300' :
                        selectedTeam.status === 'seeking-members' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {selectedTeam.status === 'seeking-members' ? '🔍 SEEKING MEMBERS' : selectedTeam.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {selectedTeam.members?.length || 0}/{selectedTeam.maxMembers} members
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTeamDetailsModal(false);
                    setSelectedTeam(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaProjectDiagram className="w-5 h-5 text-purple-400" />
                  About This Team
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedTeam.description || 'No description provided.'}
                </p>
              </div>

              {/* Team Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Skills Needed */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FaRocket className="w-5 h-5 text-purple-400" />
                    Skills Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.skillsNeeded && selectedTeam.skillsNeeded.length > 0 ? (
                      selectedTeam.skillsNeeded.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-500/15 text-purple-300 text-sm rounded-lg border border-purple-500/20">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No specific skills required</span>
                    )}
                  </div>
                </div>

                {/* Time Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FaCalendarAlt className="w-5 h-5 text-purple-400" />
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      <span className="text-gray-400">Expires:</span> {formatExpirationDate(selectedTeam.expiresAt)}
                    </p>
                    <p className="text-purple-400 font-medium">
                      {getTimeRemaining(selectedTeam.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Leader */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaChalkboardTeacher className="w-5 h-5 text-purple-400" />
                  Team Leader
                </h3>
                <div className="flex items-center gap-4 bg-gray-700/30 rounded-lg p-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {selectedTeam.leaderId?.fullName ? selectedTeam.leaderId.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TL'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedTeam.leaderId?.fullName || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">@{selectedTeam.leaderId?.username || 'unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Current Members */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaUserFriends className="w-5 h-5 text-purple-400" />
                  Team Members ({selectedTeam.members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {member.fullName ? member.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'M'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {member._id === currentUserId ? `${member.fullName} (You)` : member.fullName}
                          </p>
                          <p className="text-gray-400 text-sm">@{member.username}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.status === 'online' ? 'bg-green-500/20 text-green-300' :
                          member.status === 'busy' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No members yet. Be the first to join!</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleJoinTeam(selectedTeam._id);
                    setShowTeamDetailsModal(false);
                  }}
                  disabled={
                    (selectedTeam.status !== 'seeking-members' && !selectedTeam.members?.some(member => member._id === currentUserId)) ||
                    joiningTeamId === selectedTeam._id
                  }
                  className={`flex-1 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    joiningTeamId === selectedTeam._id
                      ? 'bg-gray-600 text-gray-300 cursor-wait'
                      : selectedTeam.members?.some(member => member._id === currentUserId)
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : selectedTeam.status === 'seeking-members'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {joiningTeamId === selectedTeam._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : selectedTeam.members?.some(member => member._id === currentUserId) ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaUserMinus className="w-5 h-5" />
                      Leave Team
                    </span>
                  ) : selectedTeam.status === 'seeking-members' ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaUserPlus className="w-5 h-5" />
                      Join Team
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaUser className="w-5 h-5" />
                      Team Closed
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowTeamDetailsModal(false);
                    setSelectedTeam(null);
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;