'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewModalProps {
  type: 'ride' | 'roommate';
  reviewedUserId: string;
  reviewedUserName: string;
  rideId?: string;
  trigger?: React.ReactNode;
}

export default function ReviewModal({ 
  type, 
  reviewedUserId, 
  reviewedUserName, 
  rideId, 
  trigger 
}: ReviewModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      const reviewData: any = {
        type,
        reviewedUserId,
        rating,
        review: review.trim()
      };

      if (type === 'ride' && rideId) {
        reviewData.rideId = rideId;
      }

      const response = await fetch(`http://localhost:5000/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} review posted successfully`);
        setOpen(false);
        setRating(0);
        setReview('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to post review');
      }
    } catch (error) {
      toast.error('Error posting review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review for {reviewedUserName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rating">Rating</Label>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && `${rating}/5`}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={`Share your experience with ${reviewedUserName}...`}
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || rating === 0}>
              {submitting ? 'Posting...' : 'Post Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 