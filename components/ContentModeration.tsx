'use client';

import { useState, useEffect, useCallback } from 'react';

interface ContentItem {
  id: string;
  type: 'answer' | 'story';
  content: string;
  created_at: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  } | null;
  question?: string;
  metadata?: {
    question_id?: string;
    project_id?: string;
    person_name?: string;
    subject_type?: string;
  };
}

interface ContentModerationProps {
  adminToken: string;
}

export default function ContentModeration({ adminToken }: ContentModerationProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'all' | 'answers' | 'stories'>('all');

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/content?type=${contentType}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to fetch content');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, contentType]);

  const handleModerationAction = async (contentId: string, contentType: string, action: 'approve' | 'flag' | 'remove', reason?: string) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          contentId,
          contentType,
          action,
          reason,
        }),
      });

      if (response.ok) {
        // Refresh content list
        await fetchContent();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to perform moderation action');
      }
    } catch (error) {
      console.error('Error performing moderation action:', error);
      setError('Failed to perform moderation action');
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchContent();
    }
  }, [adminToken, fetchContent]);

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Content Moderation</h3>
        <div className="flex space-x-2">
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as 'all' | 'answers' | 'stories')}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Content</option>
            <option value="answers">Answers Only</option>
            <option value="stories">Stories Only</option>
          </select>
          <button
            onClick={fetchContent}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {content.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No content found for moderation.</p>
          ) : (
            content.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      item.type === 'answer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleModerationAction(item.id, item.type, 'approve')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerationAction(item.id, item.type, 'flag', 'Flagged for review')}
                      className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this content? This action cannot be undone.')) {
                          handleModerationAction(item.id, item.type, 'remove', 'Removed by admin');
                        }
                      }}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm text-gray-700">{truncateContent(item.content)}</p>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {item.user && (
                    <p>
                      <strong>User:</strong> {item.user.name || 'Unknown'} ({item.user.email || 'No email'})
                    </p>
                  )}
                  {item.question && (
                    <p>
                      <strong>Question:</strong> {truncateContent(item.question, 100)}
                    </p>
                  )}
                  {item.metadata?.person_name && (
                    <p>
                      <strong>Story Subject:</strong> {item.metadata.person_name} ({item.metadata.subject_type})
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
