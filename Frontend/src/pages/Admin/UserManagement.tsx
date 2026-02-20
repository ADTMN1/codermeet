import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Shield, 
  Search,
  Filter,
  Edit,
  Trash2,
  Crown,
  User as UserIcon,
  Mail,
  Calendar
} from 'lucide-react';
import { adminService, User, UserStats } from '../../services/adminService';
import { toast } from 'sonner';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getUserStats()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
      fetchUserData(); // Refresh stats
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesRole && matchesPlan;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
        <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Premium Users</p>
                <p className="text-2xl font-bold text-white">{stats.premiumUsers}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-600 to-green-800 border border-green-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Professionals</p>
                <p className="text-2xl font-bold text-white">{stats.professionalUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">New This Month</p>
                <p className="text-2xl font-bold text-white">{stats.newUsersThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-red-600 to-red-800 border border-red-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">Admins</p>
                <p className="text-2xl font-bold text-white">{stats.adminUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-red-300" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="all">All Plans</option>
            <option value="Trial">Trial</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Professional
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.fullName}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          @{user.username}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.role === 'admin' ? (
                        <><Shield className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><UserIcon className="h-3 w-3 mr-1" /> User</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.plan === 'Premium' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : user.plan === 'Basic'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.isProfessional 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.isProfessional ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.fullName)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserX className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;
