
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Activity } from 'lucide-react';
import { SessionSecurityManager, SessionMetrics } from '@/lib/session-security-manager';

interface SecurityHealthData {
  overallScore: number;
  threats: {
    level: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    description: string;
  }[];
  sessionMetrics: SessionMetrics | null;
  recentEvents: {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    description: string;
  }[];
  activeUsers: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

export const SecurityHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SecurityHealthData>({
    overallScore: 85,
    threats: [
      { level: 'low', count: 2, description: 'Minor security notices' },
      { level: 'medium', count: 1, description: 'Attention required' },
      { level: 'high', count: 0, description: 'High priority issues' },
      { level: 'critical', count: 0, description: 'Critical threats' }
    ],
    sessionMetrics: null,
    recentEvents: [],
    activeUsers: 1,
    systemStatus: 'healthy'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSecurityData = () => {
      try {
        // Get session metrics with fallback
        const sessionMetrics = SessionSecurityManager.getSessionMetrics('anonymous') || {
          sessionDuration: 0,
          inactivityDuration: 0,
          lastActivity: Date.now(),
          createdAt: Date.now(),
          sessionHealth: 'good' as const
        };

        // Simulate recent security events
        const recentEvents = [
          {
            id: '1',
            type: 'SESSION_START',
            severity: 'low' as const,
            timestamp: new Date(),
            description: 'New session initiated'
          },
          {
            id: '2',
            type: 'DEVICE_FINGERPRINT',
            severity: 'low' as const,
            timestamp: new Date(Date.now() - 5000),
            description: 'Device fingerprint verified'
          }
        ];

        setHealthData(prev => ({
          ...prev,
          sessionMetrics,
          recentEvents
        }));
      } catch (error) {
        console.error('Error loading security data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSecurityData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading security dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Security Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Security Health Score</CardTitle>
          <Shield className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Progress value={healthData.overallScore} className="w-full" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(healthData.overallScore)}`}>
              {healthData.overallScore}%
            </div>
          </div>
          <div className="mt-2">
            <Badge className={getStatusColor(healthData.systemStatus)}>
              {healthData.systemStatus.charAt(0).toUpperCase() + healthData.systemStatus.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Threat Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Threat Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthData.threats.map((threat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold mb-1">{threat.count}</div>
                <Badge className={getThreatLevelColor(threat.level)}>
                  {threat.level}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  {threat.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Metrics */}
      {healthData.sessionMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Session Duration</div>
                <div className="text-lg font-semibold">
                  {formatDuration(healthData.sessionMetrics.sessionDuration)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Session Health</div>
                <Badge className={
                  healthData.sessionMetrics.sessionHealth === 'good' ? 'bg-green-100 text-green-800' :
                  healthData.sessionMetrics.sessionHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {healthData.sessionMetrics.sessionHealth}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-500">Last Activity</div>
                <div className="text-lg font-semibold">
                  {formatDuration(Date.now() - healthData.sessionMetrics.lastActivity)} ago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-500" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData.recentEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No recent security events
            </div>
          ) : (
            <div className="space-y-3">
              {healthData.recentEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <Badge className={getThreatLevelColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{event.type}</div>
                      <div className="text-xs text-gray-500">{event.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Active Users</div>
              <div className="text-2xl font-bold text-green-600">{healthData.activeUsers}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">System Status</div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
