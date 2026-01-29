/**
 * FeedbackForm Component
 *
 * Form for submitting feedback that creates GitHub issues.
 * Uses React Hook Form with Zod validation.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  feedbackFormSchema,
  type FeedbackFormData,
  type FeedbackCategory,
  CATEGORY_LABELS,
} from '../validation/feedbackSchemas';

interface FeedbackFormProps {
  userEmail: string;
  onSuccess?: () => void;
}

export default function FeedbackForm({ userEmail, onSuccess }: FeedbackFormProps) {
  const submitFeedback = useAction(api.feedback.submitFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    issueUrl: string;
    issueNumber: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    mode: 'onBlur',
    defaultValues: {
      category: 'bug',
      subject: '',
      description: '',
    },
  });

  const category = watch('category');

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await submitFeedback({
        ...data,
        userEmail,
      });

      setSuccessResult({
        issueUrl: result.issueUrl,
        issueNumber: result.issueNumber,
      });
      reset();
      onSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setSuccessResult(null);
    setSubmitError(null);
  };

  // Success state
  if (successResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-md bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
          <div className="space-y-2">
            <p className="font-medium">Feedback submitted!</p>
            <p className="text-sm">
              Your feedback has been submitted as issue #{successResult.issueNumber}.
            </p>
            <a
              href={successResult.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-300 hover:underline"
            >
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Button variant="outline" onClick={handleSubmitAnother}>
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Privacy notice */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Your feedback will be submitted as a
          public GitHub issue. Your email will be included for follow-up
          purposes. Do not include sensitive personal information.
        </AlertDescription>
      </Alert>

      {/* Error message */}
      {submitError && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Category dropdown */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={category}
          onValueChange={(value: FeedbackCategory) => setValue('category', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((key) => (
              <SelectItem key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject field */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          type="text"
          placeholder="Brief summary of your feedback"
          disabled={isSubmitting}
          aria-invalid={errors.subject ? 'true' : 'false'}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          {...register('subject')}
        />
        {errors.subject && (
          <p id="subject-error" className="text-sm text-destructive">
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Please provide as much detail as possible. For bugs, include steps to reproduce."
          disabled={isSubmitting}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* User email (read-only display) */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Your email</Label>
        <p className="text-sm">{userEmail}</p>
        <p className="text-xs text-muted-foreground">
          This will be included in the issue for follow-up.
        </p>
      </div>

      {/* Submit button */}
      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </form>
  );
}
