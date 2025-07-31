'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, Clock, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Ride {
  _id: string;
  startingFrom: string;
  goingTo: string;
  travelDate: string;
  departureStartTime: string;
  departureEndTime: string;
  availableSeats: number;
  suggestedContribution: number;
  status: string;
  createdAt: string;
  interestCount: number;
}

export default function MyRidesPage() {
  const { user, token } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchMyRides();
    }
  }, [token]);

  const fetchMyRides = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rides/my-rides`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRides(data.rides || []);
      } else {
        toast.error('Failed to fetch your rides');
      }
    } catch (error) {
      toast.error('Error fetching rides');
    } finally {
      setLoading(false);
    }
  };

  const deleteRide = async (rideId: string) => {
    if (!confirm('Are you sure you want to delete this ride?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rides/${rideId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Ride deleted successfully');
        fetchMyRides();
      } else {
        toast.error('Failed to delete ride');
      }
    } catch (error) {
      toast.error('Error deleting ride');
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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rides</h1>
        <p className="text-gray-600">Manage your posted rides and track interest</p>
      </div>

      {rides.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No rides posted yet</h3>
              <p className="text-sm">Start by creating your first ride posting</p>
            </div>
            <Button asChild>
              <a href="/rides/create">Create Ride</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rides.map((ride) => (
            <Card key={ride._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {ride.startingFrom} → {ride.goingTo}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={ride.status === 'active' ? 'default' : 'secondary'}>
                      {ride.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/rides/edit/${ride._id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRide(ride._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formatDate(ride.travelDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formatTime(ride.departureStartTime)} - {formatTime(ride.departureEndTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {ride.availableSeats} seats available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      ${ride.suggestedContribution} suggested
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {ride.interestCount} people interested
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Posted {formatDate(ride.createdAt)}
                    </div>
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