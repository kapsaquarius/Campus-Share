'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  _id: string;
  type: 'ride' | 'roommate';
  rating: number;
  review: string;
  createdAt: string;
  reviewedUser?: {
    name: string;
    profilePicture: string;
  };
  reviewer?: {
    name: string;
    profilePicture: string;
  };
}

export default function ReviewsPage() {
  const { user, token } = useAuth();
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [reviewsForMe, setReviewsForMe] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token]);

  const fetchReviews = async () => {
    try {
      // Fetch reviews I've written
      const myReviewsResponse = await fetch(`http://localhost:5000/api/reviews/my-reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (myReviewsResponse.ok) {
        const myReviewsData = await myReviewsResponse.json();
        setMyReviews(myReviewsData.reviews || []);
      }

      // Fetch reviews written about me
      const reviewsForMeResponse = await fetch(`http://localhost:5000/api/reviews/user/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reviewsForMeResponse.ok) {
        const reviewsForMeData = await reviewsForMeResponse.json();
        setReviewsForMe(reviewsForMeData.reviews || []);
      }
    } catch (error) {
      toast.error('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Review deleted successfully');
        fetchReviews();
      } else {
        toast.error('Failed to delete review');
      }
    } catch (error) {
      toast.error('Error deleting review');
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600">Manage your reviews and see what others say about you</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Reviews for Me</TabsTrigger>
          <TabsTrigger value="written">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {reviewsForMe.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-sm">Reviews from others will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviewsForMe.map((review) => (
                <Card key={review._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {review.reviewer?.name || 'Anonymous'}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {review.type}
                            </Badge>
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  {review.review && (
                    <CardContent>
                      <p className="text-gray-700">{review.review}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="written" className="space-y-4">
          {myReviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No reviews written yet</h3>
                  <p className="text-sm">Reviews you write will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myReviews.map((review) => (
                <Card key={review._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Review for {review.reviewedUser?.name || 'Unknown User'}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {review.type}
                            </Badge>
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReview(review._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {review.review && (
                    <CardContent>
                      <p className="text-gray-700">{review.review}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 