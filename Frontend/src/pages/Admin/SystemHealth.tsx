import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock,
  Zap,
  Thermometer,
  MemoryStick,
  Globe,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    upload: number;
    download: number;
    latency: number;
  };
  database: {
    connections: number;
    responseTime: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  server: {
    uptime: number;
    requests: number;
    errors: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemMetrics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSystemMetrics, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      const mockMetrics: SystemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          cores: 8,
          temperature: 45 + Math.random() * 30
        },
        memory: {
          used: 8.2 + Math.random() * 4,
          total: 16,
          percentage: (8.2 + Math.random() * 4) / 16 * 100
        },
        disk: {
          used: 250 + Math.random() * 100,
          total: 500,
          percentage: (250 + Math.random() * 100) / 500 * 100
        },
        network: {
          upload: Math.random() * 100,
          download: Math.random() * 200,
          latency: 10 + Math.random() * 50
        },
        database: {
          connections: 15 + Math.floor(Math.random() * 20),
          responseTime: 50 + Math.random() * 100,
          status: Math.random() > 0.8 ? 'warning' : 'healthy'
        },
        server: {
          uptime: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Random uptime up to 7 days
          requests: Math.floor(Math.random() * 10000),
          errors: Math.floor(Math.random() * 100),
          status: Math.random() > 0.9 ? 'critical' : Math.random() > 0.7 ? 'warning' : 'healthy'
        }
      };
      
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatBytes = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(1)} MB`;
    return `${gb.toFixed(1)} GB`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Health</h2>
          <p className="text-gray-400">Monitor system performance and infrastructure</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-gray-600 ${autoRefresh ? 'text-green-400 border-green-600' : 'text-gray-300'}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            onClick={fetchSystemMetrics}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Server Status</span>
            {getStatusIcon(metrics?.server.status || 'unknown')}
          </div>
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white capitalize">
                {metrics?.server.status || 'Unknown'}
              </p>
              <p className="text-xs text-gray-400">
                Uptime: {metrics ? formatUptime(metrics.server.uptime) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">CPU Usage</span>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-sm font-bold">
                {metrics ? Math.round(metrics.cpu.usage) : 0}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {metrics ? Math.round(metrics.cpu.usage) : 0}%
              </p>
              <p className="text-xs text-gray-400">
                {metrics?.cpu.cores || 0} cores • {metrics ? Math.round(metrics.cpu.temperature) : 0}°C
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Memory</span>
            <MemoryStick className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 text-sm font-bold">
                {metrics ? Math.round(metrics.memory.percentage) : 0}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {metrics ? formatBytes(metrics.memory.used) : '0 GB'}
              </p>
              <p className="text-xs text-gray-400">
                of {metrics ? formatBytes(metrics.memory.total) : '0 GB'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Database</span>
            {getStatusIcon(metrics?.database.status || 'unknown')}
          </div>
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {metrics?.database.connections || 0}
              </p>
              <p className="text-xs text-gray-400">
                Connections • {metrics ? Math.round(metrics.database.responseTime) : 0}ms
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            {/* CPU Usage Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-white">{metrics ? Math.round(metrics.cpu.usage) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.cpu.usage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Usage Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Memory Usage</span>
                <span className="text-white">{metrics ? Math.round(metrics.memory.percentage) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.memory.percentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Disk Usage Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Disk Usage</span>
                <span className="text-white">{metrics ? Math.round(metrics.disk.percentage) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics?.disk.percentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Network Activity */}
            <div className="pt-4 border-t border-gray-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Upload</p>
                    <p className="text-sm text-white">{metrics ? metrics.network.upload.toFixed(1) : 0} MB/s</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Download</p>
                    <p className="text-sm text-white">{metrics ? metrics.network.download.toFixed(1) : 0} MB/s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Server Statistics */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-green-400" />
            Server Statistics
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Total Requests</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {metrics?.server.requests.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-400">Errors</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {metrics?.server.errors.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">Database Performance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Response Time</span>
                <span className="text-sm text-white">{metrics ? Math.round(metrics.database.responseTime) : 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Active Connections</span>
                <span className="text-sm text-white">{metrics?.database.connections || 0}</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Network Latency</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Current Latency</span>
                <span className={`text-sm font-medium ${
                  (metrics?.network.latency || 0) < 50 ? 'text-green-400' :
                  (metrics?.network.latency || 0) < 100 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {metrics ? Math.round(metrics.network.latency) : 0}ms
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(metrics?.server.status || 'unknown')}`}>
              {getStatusIcon(metrics?.server.status || 'unknown')}
            </div>
            <div>
              <p className="text-white font-medium">Web Server</p>
              <p className="text-sm text-gray-400 capitalize">{metrics?.server.status || 'Unknown'}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(metrics?.database.status || 'unknown')}`}>
              {getStatusIcon(metrics?.database.status || 'unknown')}
            </div>
            <div>
              <p className="text-white font-medium">Database</p>
              <p className="text-sm text-gray-400 capitalize">{metrics?.database.status || 'Unknown'}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">Security</p>
              <p className="text-sm text-gray-400">Protected</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
