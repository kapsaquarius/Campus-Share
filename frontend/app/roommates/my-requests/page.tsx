'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Home, DollarSign, Calendar, Edit, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface RoommateRequest {
  _id: string;
  roomPreference: string;
  bathroomPreference: string;
  dietaryPreference: string;
  culturalPreference: string;
  petFriendly: boolean;
  rentBudget: number;
  aboutMe: string;
  lifestyleQuestionnaire: {
    sleepSchedule: string;
    cleanliness: string;
    noiseLevel: string;
    guests: string;
    studyHabits: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyRoommateRequestsPage() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchMyRequests();
    }
  }, [token, statusFilter]);

  const fetchMyRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/roommates/my-requests?status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        toast.error('Failed to fetch your roommate requests');
      }
    } catch (error) {
      toast.error('Error fetching roommate requests');
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this roommate request?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/roommates/my-request`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Roommate request cancelled successfully');
        fetchMyRequests();
      } else {
        toast.error('Failed to cancel roommate request');
      }
    } catch (error) {
      toast.error('Error cancelling roommate request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Roommate Requests</h1>
        <p className="text-gray-600">View and manage your roommate requests</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by status:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No roommate requests found</h3>
              <p className="text-sm">
                {statusFilter === 'all' 
                  ? 'Create your first roommate request to get started'
                  : `No ${statusFilter} requests found`
                }
              </p>
            </div>
            {statusFilter === 'all' && (
              <Button asChild>
                <a href="/roommates/create">Create Request</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Roommate Request
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    {request.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/roommates/edit'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRequest(request._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {request.roomPreference} room
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {request.bathroomPreference} bathroom
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Budget: ${request.rentBudget}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Dietary Preference:</span>
                    <span className="text-sm text-gray-600">{request.dietaryPreference}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Cultural Preference:</span>
                    <span className="text-sm text-gray-600">{request.culturalPreference}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Pet Friendly:</span>
                    <span className="text-sm text-gray-600">
                      {request.petFriendly ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {request.aboutMe && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">About Me</h4>
                    <p className="text-sm text-gray-600">{request.aboutMe}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {formatDate(request.createdAt)}
                    </div>
                    {request.updatedAt !== request.createdAt && (
                      <div className="text-xs text-gray-500">
                        Updated {formatDate(request.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 