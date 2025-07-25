'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ChapterProgress from '../../../components/ChapterProgress';
import { useAuth } from '../../../context/AuthContext';
import CLIENT_WHATSAPP_CONFIG from '../../../lib/clientWhatsappConfig';

interface Question {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
  status: string;
  answer?: string;
  skipped_reason?: string;
  answeredAt?: string;
  // Enhanced tracking fields
  forwarded_to?: string; // Team member names who received this question
  forwarded_at?: string; // When it was last forwarded
  forwarded_count?: number; // How many times forwarded
  last_forwarded_method?: 'whatsapp' | 'email'; // Last method used
}

interface TeamMember {
  id: string;
  story_id: string;
  name: string;
  phone_number?: string;
  email?: string;
  created_at: string;
}

interface EmailResponse {
  id: string;
  question_id: string;
  story_id: string;
  team_member_id: string;
  team_member_name: string;
  response_content: string;
  email_message_id?: string;
  created_at: string;
  updated_at: string;
  status: 'received' | 'reviewed' | 'integrated';
}

interface ProjectData {
  id: string;
  person_name?: string;
  subject_type: string;
  period_type: string;
  writing_style: string;
  status: string;
  created_at: string;
  is_deceased?: boolean;
  passed_away_year?: string;
  metadata?: {
    whatsappChat?: {
      messageCount: number;
      participants: string[];
      dateRange: {
        start: string;
        end: string;
      };
    };
    includeWhatsappChat?: boolean;
    communicationMethods?: {
      whatsapp?: boolean;
      email?: boolean;
      dashboard?: boolean;
      voice?: boolean;
    };
    [key: string]: unknown;
  };
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyPreview, setStoryPreview] = useState<string>('');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [introduction, setIntroduction] = useState<string>('');
  const [showIntroductionForm, setShowIntroductionForm] = useState(true); // Always show the form initially
  const [introductionSaving, setIntroductionSaving] = useState(false);
  const [whatsappChatFile, setWhatsappChatFile] = useState<File | null>(null);
  const [whatsappUploading, setWhatsappUploading] = useState(false);
  
  // New state for managing question editing
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionAnswer, setEditingQuestionAnswer] = useState<string>('');
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  // State for temporary answers for unanswered questions
  const [tempAnswers, setTempAnswers] = useState<Record<string, string>>({});
  
  // State for story editing
  const [editingStory, setEditingStory] = useState(false);
  const [editedStoryContent, setEditedStoryContent] = useState<string>('');
  const [savingStory, setSavingStory] = useState(false);
  const [storyLoaded, setStoryLoaded] = useState(false);
  
  // State for forwarding questions to team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showForwardModal, setShowForwardModal] = useState<string | null>(null);
  const [sendingQuestionId, setSendingQuestionId] = useState<string | null>(null);
  
  // State for email responses
  const [emailResponses, setEmailResponses] = useState<EmailResponse[]>([]);
  // const [showEmailResponses, setShowEmailResponses] = useState(false); // Not used currently
  
  // State for team member management
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [newTeamMemberName, setNewTeamMemberName] = useState('');
  const [newTeamMemberPhone, setNewTeamMemberPhone] = useState('');
  const [newTeamMemberEmail, setNewTeamMemberEmail] = useState('');
  const [addingTeamMember, setAddingTeamMember] = useState(false);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  
  // State for tracking question forwarding
  const [questionTrackingData, setQuestionTrackingData] = useState<Record<string, {
    forwarded_to: string[];
    forwarded_at: string;
    forwarded_method: 'whatsapp' | 'email';
    responses: EmailResponse[];
  }>>({});

  // Load question tracking data
  const loadQuestionTracking = useCallback(async () => {
    if (!questions.length) return;
    
    try {
      const trackingData: Record<string, {
        forwarded_to: string[];
        forwarded_at: string;
        forwarded_method: 'whatsapp' | 'email';
        responses: EmailResponse[];
      }> = {};
      
      // Load tracking data for each question
      await Promise.all(questions.map(async (question) => {
        try {
          const response = await fetch(`/api/questions/track?questionId=${question.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.tracking) {
              trackingData[question.id] = {
                forwarded_to: data.tracking.forwarded_to || [],
                forwarded_at: data.tracking.forwarded_at,
                forwarded_method: data.tracking.last_forwarded_method || 'email',
                responses: []
              };
            }
          }
        } catch (error) {
          console.error(`Error loading tracking for question ${question.id}:`, error);
        }
      }));
      
      setQuestionTrackingData(trackingData);
    } catch (error) {
      console.error('Error loading question tracking data:', error);
    }
  }, [questions]);

  // Load email responses
  const loadEmailResponses = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/questions/email-responses?storyId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmailResponses(data.responses || []);
        }
      }
    } catch (error) {
      console.error('Error loading email responses:', error);
    }
  }, [projectId]);

  // Load project data
  const loadProject = useCallback(async () => {
    if (!projectId || !user?.id) return;
    
    try {
      const response = await fetch(`/api/stories/${projectId}?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setProjectData(data.project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  }, [projectId, user?.id]);

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    if (!projectId || !user?.id) return;
    
    setQuestionsLoading(true);
    try {
      const response = await fetch(`/api/questions?storyId=${projectId}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions || []);
        
        // Count answered questions
        const answered = data.questions?.filter((q: Question) => q.answer && q.answer.trim()) || [];
        setAnsweredQuestionsCount(answered.length);
      }
      
      // Also load email responses when loading questions
      await loadEmailResponses();
      
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  }, [projectId, user?.id, loadEmailResponses]);

  // Load introduction
  const loadIntroduction = useCallback(async () => {
    if (!projectId || !user?.id) return;
    
    try {
      const response = await fetch(`/api/introduction?projectId=${projectId}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        const loadedIntroduction = data.introduction || '';
        setIntroduction(loadedIntroduction);
        
        // Only hide the form if we actually loaded an existing introduction from the database
        if (loadedIntroduction && loadedIntroduction.trim().length > 0) {
          setShowIntroductionForm(false);
        }
      }
    } catch (error) {
      console.error('Error loading introduction:', error);
    }
  }, [projectId, user?.id]);

  // Load existing story
  const loadExistingStory = useCallback(async () => {
    if (!projectId || !user?.id || storyLoaded) return;
    
    try {
      const response = await fetch(`/api/story-preview?projectId=${projectId}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.exists && data.storyPreview) {
        setStoryPreview(data.storyPreview.content);
        setStoryLoaded(true);
      }
    } catch (error) {
      console.error('Error loading existing story:', error);
    }
  }, [projectId, user?.id, storyLoaded]);

  // Load questions when component mounts
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Load project when component mounts
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Load introduction when component mounts
  useEffect(() => {
    loadIntroduction();
  }, [loadIntroduction]);

  // Load existing story when component mounts
  useEffect(() => {
    loadExistingStory();
  }, [loadExistingStory]);

  const handleGenerateGenericQuestions = async () => {
    if (!projectId || !user?.id) return;
    
    setIsGeneratingQuestions(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'generate',
          storyId: projectId,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh questions list
        await fetchQuestions();
        alert(`Basis vragen gegenereerd!`);
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating generic questions:', error);
      alert('Er ging iets mis bij het genereren van basis vragen.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateSmartQuestions = async () => {
    if (!projectId || !user?.id) return;
    
    setIsGeneratingQuestions(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh questions list
        await fetchQuestions();
        alert(`${data.questionsGenerated} nieuwe vragen gegenereerd!`);
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Er ging iets mis bij het genereren van vragen.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateStoryPreview = async () => {
    if (!projectId || !user?.id) return;
    
    setIsGeneratingStory(true);
    try {
      const response = await fetch('/api/generate-story-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryPreview(data.storyPreview);
        setShowStoryModal(true);
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating story preview:', error);
      alert('Er ging iets mis bij het genereren van het verhaal.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSaveIntroduction = async (introText: string) => {
    if (!projectId || !user?.id) return;
    
    setIntroductionSaving(true);
    try {
      const response = await fetch('/api/introduction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user.id,
          introduction: introText,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIntroduction(introText);
        setShowIntroductionForm(false);
        alert('Introductie opgeslagen!');
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving introduction:', error);
      alert('Er ging iets mis bij het opslaan van de introductie.');
    } finally {
      setIntroductionSaving(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!projectId || !user?.id) return;
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'answer',
          storyId: projectId,
          userId: user.id,
          questionId,
          answer,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh questions list
        await fetchQuestions();
        // Success - no popup needed, user can see the answer was saved
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Er ging iets mis bij het opslaan van het antwoord.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!projectId || !user?.id) return;
    
    // Ask for confirmation
    if (!confirm('Weet je zeker dat je deze vraag wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/questions?questionId=${questionId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh questions list
        await fetchQuestions();
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Er ging iets mis bij het verwijderen van de vraag.');
    }
  };

  // New functions for question editing workflow
  const handleEditQuestion = (questionId: string, currentAnswer: string) => {
    setEditingQuestionId(questionId);
    setEditingQuestionAnswer(currentAnswer);
  };

  const handleSaveQuestionAnswer = async (questionId: string, answer: string) => {
    if (!answer.trim()) {
      alert('Vul een antwoord in voordat je opslaat.');
      return;
    }

    setSavingQuestionId(questionId);
    try {
      await handleAnswerQuestion(questionId, answer);
      // Clear editing states and temp answers
      setEditingQuestionId(null);
      setEditingQuestionAnswer('');
      setTempAnswers(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestionAnswer('');
  };

  // Story functions
  const handleEditStory = () => {
    setEditedStoryContent(storyPreview);
    setEditingStory(true);
  };

  const handleSaveStoryEdit = async () => {
    if (!projectId || !user?.id) return;
    
    setSavingStory(true);
    try {
      const response = await fetch('/api/story-preview', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user.id,
          content: editedStoryContent,
          status: 'edited'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryPreview(editedStoryContent);
        setEditingStory(false);
        alert('Verhaal succesvol opgeslagen!');
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving story edit:', error);
      alert('Er ging iets mis bij het opslaan van het verhaal.');
    } finally {
      setSavingStory(false);
    }
  };

  const handleCancelStoryEdit = () => {
    setEditingStory(false);
    setEditedStoryContent('');
  };

  const handleUpdateStory = async () => {
    if (!projectId || !user?.id) return;
    
    // Ask for confirmation
    if (!confirm('Weet je zeker dat je het verhaal wilt bijwerken met je nieuwe antwoorden? Je huidige bewerkingen gaan verloren.')) {
      return;
    }
    
    setIsGeneratingStory(true);
    try {
      const response = await fetch('/api/generate-story-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryPreview(data.storyPreview);
        setEditingStory(false); // Close edit mode if open
        alert('Verhaal succesvol bijgewerkt met je nieuwe antwoorden!');
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Er ging iets mis bij het bijwerken van het verhaal.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleWhatsAppUpload = async () => {
    if (!projectId || !user?.id || !whatsappChatFile) return;
    
    setWhatsappUploading(true);
    try {
      const formData = new FormData();
      formData.append('whatsappChatFile', whatsappChatFile);
      formData.append('projectId', projectId);
      formData.append('userId', user.id);

      const response = await fetch('/api/whatsapp-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`WhatsApp chat succesvol geüpload! ${data.messageCount} berichten verwerkt.`);
        setWhatsappChatFile(null);
        // Refresh project data
        await loadProject();
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading WhatsApp chat:', error);
      alert('Er ging iets mis bij het uploaden van de WhatsApp chat.');
    } finally {
      setWhatsappUploading(false);
    }
  };

  // Team member functions
  const fetchTeamMembers = useCallback(async () => {
    if (!projectId || !user?.id) return;
    
    setTeamMembersLoading(true);
    try {
      const response = await fetch(`/api/team-members?storyId=${projectId}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTeamMembers(data.teamMembers || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setTeamMembersLoading(false);
    }
  }, [projectId, user?.id]);

  const handleForwardQuestion = async (questionId: string, teamMemberId: string, method: 'whatsapp' | 'email') => {
    setSendingQuestionId(questionId);
    
    try {
      const question = questions.find(q => q.id === questionId);
      const teamMember = teamMembers.find(m => m.id === teamMemberId);
      
      if (!question || !teamMember) {
        alert('Vraag of teamlid niet gevonden.');
        return;
      }

      if (method === 'whatsapp') {
        if (!teamMember.phone_number) {
          alert('Dit teamlid heeft geen WhatsApp nummer.');
          return;
        }
        
        const response = await fetch('/api/whatsapp/send-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            teamMemberIds: [teamMemberId],
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert(`Vraag succesvol verzonden naar ${teamMember.name} via WhatsApp!`);
          
          // Save tracking data to database
          await saveQuestionTracking(questionId, teamMember.name, 'whatsapp');
        } else {
          alert(`Fout: ${data.error}`);
        }
      } else if (method === 'email' && teamMember.email) {
        const response = await fetch('/api/email/send-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: teamMember.email,
            question: question.question,
            storyId: projectId,
            questionId: questionId,
            memberName: teamMember.name,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert(`Vraag succesvol verzonden naar ${teamMember.name} via e-mail!`);
          
          // Save tracking data to database
          await saveQuestionTracking(questionId, teamMember.name, 'email');
        } else {
          alert(`Fout: ${data.error}`);
        }
      } else {
        alert('Geen e-mailadres beschikbaar voor dit teamlid.');
      }
    } catch (error) {
      console.error('Error forwarding question:', error);
      alert('Er ging iets mis bij het doorsturen van de vraag.');
    } finally {
      setSendingQuestionId(null);
      setShowForwardModal(null);
    }
  };

  // Save question tracking to database
  const saveQuestionTracking = async (questionId: string, teamMemberName: string, method: 'whatsapp' | 'email') => {
    try {
      const response = await fetch('/api/questions/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          teamMemberName,
          method,
          storyId: projectId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state with the saved tracking data
        setQuestionTrackingData(prev => ({
          ...prev,
          [questionId]: {
            forwarded_to: data.tracking.forwarded_to,
            forwarded_at: data.tracking.forwarded_at,
            forwarded_method: data.tracking.last_forwarded_method,
            responses: prev[questionId]?.responses || []
          }
        }));
      } else {
        console.error('Failed to save tracking data:', data.error);
      }
    } catch (error) {
      console.error('Error saving question tracking:', error);
    }
  };

  // Add team member
  const handleAddTeamMember = async () => {
    if (!projectId || !user?.id || !newTeamMemberName.trim()) {
      alert('Vul tenminste een naam in voordat je een teamlid toevoegt.');
      return;
    }

    // Require at least one contact method
    const hasPhone = newTeamMemberPhone.trim();
    const hasEmail = newTeamMemberEmail.trim();
    
    if (!hasPhone && !hasEmail) {
      alert('Vul tenminste één contactmethode in: WhatsApp nummer of e-mailadres.');
      return;
    }

    setAddingTeamMember(true);
    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: projectId,
          userId: user.id,
          name: newTeamMemberName.trim(),
          phoneNumber: newTeamMemberPhone.trim() || undefined,
          email: newTeamMemberEmail.trim() || undefined,
          role: 'family',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewTeamMemberName('');
        setNewTeamMemberPhone('');
        setNewTeamMemberEmail('');
        setShowAddTeamMember(false);
        await fetchTeamMembers();
        alert('Teamlid succesvol toegevoegd!');
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Er ging iets mis bij het toevoegen van het teamlid.');
    } finally {
      setAddingTeamMember(false);
    }
  };

  // Delete team member
  const handleDeleteTeamMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Weet je zeker dat je ${memberName} wilt verwijderen als teamlid?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/team-members/${memberId}?userId=${user?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTeamMembers();
        alert(`${memberName} is succesvol verwijderd als teamlid.`);
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Er ging iets mis bij het verwijderen van het teamlid.');
    }
  };

  // Load team members when component mounts
  useEffect(() => {
    if (projectId && user?.id) {
      loadProject();
      fetchQuestions();
      loadIntroduction();
      loadExistingStory();
      fetchTeamMembers();
      loadEmailResponses();
    }
  }, [projectId, user?.id, loadProject, fetchQuestions, loadIntroduction, loadExistingStory, fetchTeamMembers, loadEmailResponses]);

  // Load tracking data when questions change
  useEffect(() => {
    if (questions.length > 0) {
      loadQuestionTracking();
    }
  }, [questions, loadQuestionTracking]);

  // Fetch email responses for questions (renamed for consistency)
  const fetchEmailResponses = loadEmailResponses;

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Project Info Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  Project: {projectData?.person_name || 'Mijn verhaal'}
                </h2>
                {projectData?.is_deceased && (
                  <span className="text-yellow-600">🕊️</span>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                projectData?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {projectData?.status === 'active' ? 'Actief' : 'Concept'}
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Type:</strong> {projectData?.subject_type === 'self' ? 'Eigen verhaal' : 'Verhaal van iemand anders'}
              </div>
              <div>
                <strong>Periode:</strong> {projectData?.period_type || 'Volledig leven'}
              </div>
              <div>
                <strong>Schrijfstijl:</strong> {projectData?.writing_style || 'Neutraal'}
              </div>
              <div>
                <strong>Aangemaakt:</strong> {new Date(projectData?.created_at || '').toLocaleDateString('nl-NL')}
              </div>
              {projectData?.is_deceased && projectData?.passed_away_year && (
                <div className="col-span-2">
                  <strong>Overleden:</strong> {projectData.passed_away_year}
                </div>
              )}
            </div>
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">👥 Teamleden</h2>
              <button
                onClick={() => setShowAddTeamMember(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                ➕ Teamlid toevoegen
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                Voeg teamleden toe die vragen kunnen ontvangen via WhatsApp of e-mail om je verhaal completer te maken.
              </p>
            </div>

            {/* Add Team Member Form */}
            {showAddTeamMember && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-3">Nieuw teamlid toevoegen</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam *
                    </label>
                    <input
                      type="text"
                      value={newTeamMemberName}
                      onChange={(e) => setNewTeamMemberName(e.target.value)}
                      placeholder="Bijvoorbeeld: Moeder, Partner, Beste vriend"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={addingTeamMember}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp nummer (optioneel)
                    </label>
                    <input
                      type="tel"
                      value={newTeamMemberPhone}
                      onChange={(e) => setNewTeamMemberPhone(e.target.value)}
                      placeholder="+31612345678"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={addingTeamMember}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mailadres (optioneel)
                    </label>
                    <input
                      type="email"
                      value={newTeamMemberEmail}
                      onChange={(e) => setNewTeamMemberEmail(e.target.value)}
                      placeholder="teamlid@example.com"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={addingTeamMember}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-500">
                    * Vul tenminste één contactmethode in (WhatsApp of e-mail)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddTeamMember}
                    disabled={addingTeamMember || !newTeamMemberName.trim() || (!newTeamMemberPhone.trim() && !newTeamMemberEmail.trim())}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingTeamMember ? 'Toevoegen...' : 'Toevoegen'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTeamMember(false);
                      setNewTeamMemberName('');
                      setNewTeamMemberPhone('');
                      setNewTeamMemberEmail('');
                    }}
                    disabled={addingTeamMember}
                    className="text-gray-600 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {/* Team Members List */}
            <div className="space-y-3">
              {teamMembersLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-600">Teamleden laden...</p>
                </div>
              ) : teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{member.name}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                          {member.phone_number && (
                            <p className="text-sm text-gray-600">📱 {member.phone_number}</p>
                          )}
                          {member.email && (
                            <p className="text-sm text-gray-600">📧 {member.email}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Toegevoegd op {new Date(member.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          {member.phone_number && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              📱 WhatsApp
                            </span>
                          )}
                          {member.email && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              📧 E-mail
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTeamMember(member.id, member.name)}
                          className="text-red-600 hover:text-red-700 text-xs hover:bg-red-50 px-2 py-1 rounded transition-colors ml-2"
                          title={`Verwijder ${member.name}`}
                        >
                          🗑️ Verwijderen
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">👥</div>
                  <p className="text-gray-500 mb-2">Nog geen teamleden toegevoegd</p>
                  <p className="text-sm text-gray-400">
                    Voeg mensen toe die kunnen helpen met het beantwoorden van vragen via WhatsApp of e-mail
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Introduction Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📝 Verhaal introductie</h2>
              {!showIntroductionForm && introduction && (
                <button
                  onClick={() => setShowIntroductionForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Bewerken
                </button>
              )}
            </div>

            {showIntroductionForm ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Schrijf een introductie van je verhaal. Dit geeft onze AI context om betere, meer persoonlijke vragen te stellen. Je kunt later altijd wijzigingen maken.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Tips voor je introductie:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Vertel wie je bent en waar je vandaan komt</li>
                    <li>• Noem belangrijke mensen in je leven</li>
                    <li>• Beschrijf grote gebeurtenissen of keerpunten</li>
                    <li>• Deel wat je het belangrijkst vindt om vast te leggen</li>
                    <li>• Schrijf alsof je het aan een goede vriend vertelt</li>
                  </ul>
                </div>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-4 h-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Begin hier met je verhaal..."
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleSaveIntroduction(introduction)}
                    disabled={introductionSaving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {introductionSaving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  {introduction && (
                    <button
                      onClick={() => setShowIntroductionForm(false)}
                      className="text-gray-600 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {introduction ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{introduction}</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400">
                    <div className="flex items-start">
                      <span className="text-yellow-600 mr-3 text-xl">✨</span>
                      <div>
                        <h4 className="text-lg font-medium text-yellow-800 mb-2">Start met je verhaal introductie</h4>
                        <p className="text-yellow-700 mb-3">
                          Een introductie helpt onze AI om veel betere, persoonlijkere vragen te stellen. Dit wordt de basis voor je unieke levensverhaal.
                        </p>
                        <button
                          onClick={() => setShowIntroductionForm(true)}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                        >
                          📝 Schrijf je introductie
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chapter Progress Section */}
          <ChapterProgress 
            projectId={projectId}
            userId={user.id}
            questions={questions}
            isDeceased={projectData?.is_deceased}
            onQuestionsGenerated={fetchQuestions}
          />

          {/* WhatsApp Chat Upload Section - Only show if WhatsApp was selected during setup */}
          {(projectData?.metadata?.includeWhatsappChat || projectData?.metadata?.communicationMethods?.whatsapp) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">💬 WhatsApp Gesprekken</h2>
              </div>

              {projectData?.metadata?.whatsappChat ? (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✅</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 mb-2">WhatsApp chat geladen</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Berichten:</strong> {projectData.metadata.whatsappChat.messageCount}</p>
                      <p><strong>Deelnemers:</strong> {projectData.metadata.whatsappChat.participants?.join(', ')}</p>
                      {projectData.metadata.whatsappChat.dateRange?.start && (
                        <p><strong>Periode:</strong> {new Date(projectData.metadata.whatsappChat.dateRange.start).toLocaleDateString('nl-NL')} - {new Date(projectData.metadata.whatsappChat.dateRange.end).toLocaleDateString('nl-NL')}</p>
                      )}
                    </div>
                    <p className="text-green-600 text-sm mt-2 italic">
                      Deze gesprekken kunnen worden gebruikt om extra context te geven bij het genereren van slimme vragen en verhalen.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {CLIENT_WHATSAPP_CONFIG.shouldShowWhatsAppFeatures() ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Upload WhatsApp gesprekken om extra herinneringen en verhalen toe te voegen aan je project. 
                      {projectData?.is_deceased && ' Dit is vooral waardevol voor memorial verhalen.'}
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">💡 Waarom WhatsApp gesprekken toevoegen?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Vastleggen van spontane herinneringen en anekdotes</li>
                        <li>• Extra context voor AI om betere vragen te genereren</li>
                        <li>• Bewaren van belangrijke gesprekken en uitwisselingen</li>
                        {projectData?.is_deceased && (
                          <li>• Waardevol voor het vastleggen van laatste gesprekken en herinneringen</li>
                        )}
                      </ul>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={(e) => setWhatsappChatFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="whatsappFileUpload"
                      />
                      <label htmlFor="whatsappFileUpload" className="cursor-pointer">
                        {whatsappChatFile ? (
                          <div className="text-gray-700">
                            <p className="font-medium">📁 {whatsappChatFile.name}</p>
                            <p className="text-sm">Klik om een ander bestand te selecteren</p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <p className="font-medium">📱 Klik om WhatsApp chat te uploaden</p>
                            <p className="text-sm">Alleen .txt bestanden</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {whatsappChatFile && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleWhatsAppUpload}
                          disabled={whatsappUploading}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {whatsappUploading ? 'Uploaden...' : 'Upload WhatsApp Chat'}
                        </button>
                        <button
                          onClick={() => setWhatsappChatFile(null)}
                          className="text-gray-600 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-600">
                      <p><strong>Hoe exporteer je WhatsApp chats:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>Open het WhatsApp gesprek</li>
                        <li>Druk op de 3 puntjes (⋮) of naam van de persoon</li>
                        <li>Selecteer &quot;Exporteer chat&quot;</li>
                        <li>Kies &quot;Zonder media&quot; voor een snellere upload</li>
                        <li>Verzend naar jezelf en download het .txt bestand</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          WhatsApp Functionaliteit Tijdelijk Uitgeschakeld
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>{CLIENT_WHATSAPP_CONFIG.getDisabledMessage()}</p>
                          <p className="mt-2">
                            <strong>Alternatieven:</strong>
                          </p>
                          <ul className="mt-1 list-disc list-inside space-y-1">
                            <li>Gebruik email doorsturen voor teamleden</li>
                            <li>Voer verhalen handmatig in via het dashboard</li>
                            <li>Upload documenten via andere methoden</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">❓ Vragen & Antwoorden</h2>
                {projectData?.is_deceased && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    🕊️ Memorial verhaal
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateGenericQuestions}
                  disabled={isGeneratingQuestions}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  📝 {isGeneratingQuestions ? 'Genereren...' : 'Basis vragen'}
                </button>
                <button
                  onClick={handleGenerateSmartQuestions}
                  disabled={isGeneratingQuestions || (!introduction && answeredQuestionsCount === 0)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  title={(!introduction && answeredQuestionsCount === 0) ? "Schrijf eerst een introductie of beantwoord enkele basis vragen" : "Genereer vragen op basis van je introductie en antwoorden"}
                >
                  🧠 {isGeneratingQuestions ? 'Genereren...' : 'Slimme vragen'}
                </button>
                <button
                  onClick={fetchQuestions}
                  className="text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  🔄 Vernieuw
                </button>
              </div>
            </div>

            {questionsLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100 transition ease-in-out duration-150 cursor-not-allowed">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bezig met laden...
                </div>
              </div>
            )}

            {questions.length === 0 && !questionsLoading && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-medium text-blue-800 mb-3">✨ Wat zijn de verschillende soorten vragen?</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">📝 BASIS</span>
                    <div>
                      <strong>Basis vragen:</strong> {projectData?.is_deceased 
                        ? 'Vragen die helpen om een prachtig eerbetoon aan het leven en de herinneringen vast te leggen.'
                        : 'Standaard vragen die iedereen helpen om de belangrijkste levensmomenten vast te leggen - van jeugd tot volwassenheid.'
                      }
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">🧠 SLIM</span>
                    <div>
                      <strong>Slimme vragen:</strong> Gepersonaliseerde vragen gebaseerd op je introductie en eerdere antwoorden. Hoe meer je deelt, hoe persoonlijker de vragen worden.
                    </div>
                  </div>
                  {projectData?.is_deceased && (
                    <div className="flex items-start gap-3">
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">🕊️ MEMORIAL</span>
                      <div>
                        <strong>Memorial vragen:</strong> Speciale vragen gericht op het vastleggen van herinneringen, karaktereigenschappen en het nalatenschap van de overledene.
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-blue-700 text-sm mt-3 italic">
                  💡 Tip: {projectData?.is_deceased 
                    ? 'Begin met basis vragen om een volledig beeld van het leven te krijgen, gevolgd door memorial vragen voor persoonlijke herinneringen.'
                    : 'Begin met basis vragen of schrijf eerst een introductie voor de beste ervaring met slimme vragen.'
                  }
                </p>
              </div>
            )}

            <div className="space-y-4">
              {questions.length > 0 ? (
                questions.map((question) => {
                  const isEditing = editingQuestionId === question.id;
                  const isSaving = savingQuestionId === question.id;
                  const tracking = questionTrackingData[question.id];
                  // Filter email responses for this specific question
                  const questionEmailResponses = emailResponses.filter(response => response.question_id === question.id);
                  
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            question.category === 'memorial' 
                              ? 'text-yellow-600' 
                              : 'text-blue-600'
                          }`}>
                            {question.category === 'memorial' ? '🕊️ ' : ''}{question.category}
                          </span>
                          {question.category === 'memorial' && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              Memorial
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Forwarding Status */}
                          {tracking?.forwarded_to && tracking.forwarded_to.length > 0 && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              📤 Doorgestuurd naar {tracking.forwarded_to.length} teamli{tracking.forwarded_to.length > 1 ? 'den' : 'd'}
                            </span>
                          )}
                          
                          {/* Response Status */}
                          {questionEmailResponses.length > 0 ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              📧 {questionEmailResponses.length} reactie{questionEmailResponses.length > 1 ? 's' : ''}
                            </span>
                          ) : null}
                          
                          {/* Answer Status */}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            question.answer || questionEmailResponses.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {question.answer || questionEmailResponses.length > 0 ? 'Beantwoord' : 'Open'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-3">{question.question}</p>
                      
                      {/* Display Forwarding Info */}
                      {tracking?.forwarded_to && tracking.forwarded_to.length > 0 && (
                        <div className="mb-3">
                          <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-800">
                                📤 Doorgestuurd naar: {tracking.forwarded_to.join(', ')}
                              </span>
                              <span className="text-xs text-purple-600 flex items-center gap-1">
                                {tracking.forwarded_method === 'whatsapp' ? '📱 WhatsApp' : '📧 E-mail'}
                                {tracking.forwarded_at && (
                                  <span className="ml-2">
                                    {new Date(tracking.forwarded_at).toLocaleDateString('nl-NL', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display Email Responses */}
                      {questionEmailResponses.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            📧 Email reacties ({questionEmailResponses.length})
                          </h4>
                          {questionEmailResponses.map((response) => (
                            <div key={response.id} className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-800">
                                  {response.team_member_name}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {new Date(response.created_at).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {response.response_content.length > 200 
                                  ? `${response.response_content.substring(0, 200)}...` 
                                  : response.response_content
                                }
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  response.status === 'received' ? 'bg-yellow-100 text-yellow-800' :
                                  response.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {response.status === 'received' ? '📥 Ontvangen' :
                                   response.status === 'reviewed' ? '👀 Bekeken' :
                                   '✅ Verwerkt'}
                                </span>
                                {response.status === 'received' && (
                                  <button
                                    onClick={() => {
                                      // Add function to mark as reviewed
                                      fetch('/api/email/responses', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ responseId: response.id, status: 'reviewed' })
                                      }).then(() => fetchEmailResponses());
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Markeren als bekeken
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.answer && !isEditing ? (
                        // Display mode for answered questions
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-gray-700">{question.answer}</p>
                        </div>
                      ) : (
                        // Edit mode for unanswered questions or when editing
                        <div className="mt-3 mb-3">
                          <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Type hier je antwoord..."
                            value={isEditing ? editingQuestionAnswer : (tempAnswers[question.id] || '')}
                            onChange={(e) => {
                              if (isEditing) {
                                setEditingQuestionAnswer(e.target.value);
                              } else {
                                // For unanswered questions, store in tempAnswers
                                setTempAnswers(prev => ({
                                  ...prev,
                                  [question.id]: e.target.value
                                }));
                              }
                            }}
                            disabled={isSaving}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {question.answer && !isEditing ? (
                          // Buttons for answered questions
                          <>
                            <button
                              onClick={() => handleEditQuestion(question.id, question.answer || '')}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              💾 Bewerken
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              🗑️ Verwijderen
                            </button>
                            <button
                              onClick={() => setShowForwardModal(question.id)}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              📤 Doorsturen
                            </button>
                          </>
                        ) : (
                          // Buttons for unanswered or editing questions
                          <>
                            <button
                              onClick={() => handleSaveQuestionAnswer(
                                question.id, 
                                isEditing ? editingQuestionAnswer : (tempAnswers[question.id] || '')
                              )}
                              disabled={isSaving}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {isSaving ? 'Opslaan...' : '💾 Opslaan'}
                            </button>
                            {isEditing && (
                              <button
                                onClick={handleCancelEditQuestion}
                                disabled={isSaving}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                ❌ Annuleren
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              disabled={isSaving}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              🗑️ Verwijderen
                            </button>
                            <button
                              onClick={() => setShowForwardModal(question.id)}
                              disabled={isSaving}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              📤 Doorsturen
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nog geen vragen beschikbaar. Genereer je eerste vragen!</p>
                </div>
              )}
            </div>
          </div>

          {/* Unmatched Email Responses Section */}
          {(() => {
            const unmatchedResponses = emailResponses.filter(response => !response.question_id);
            return unmatchedResponses.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    📧 Ontvangen antwoorden ({unmatchedResponses.length})
                  </h2>
                  <div className="text-sm text-gray-600">
                    Antwoorden die niet aan een specifieke vraag gekoppeld zijn
                  </div>
                </div>
                <div className="space-y-4">
                  {unmatchedResponses.map((response) => (
                    <div key={response.id} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          {response.team_member_name}
                        </span>
                        <span className="text-xs text-blue-600">
                          {new Date(response.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {response.response_content}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          response.status === 'received' ? 'bg-yellow-100 text-yellow-800' :
                          response.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {response.status === 'received' ? '📥 Ontvangen' :
                           response.status === 'reviewed' ? '👀 Bekeken' :
                           '✅ Verwerkt'}
                        </span>
                        <button
                          onClick={() => {
                            // Mark as reviewed
                            // TODO: Implement status update
                            console.log('Mark as reviewed:', response.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Als bekeken markeren
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Story Preview Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📚 Verhaal preview</h2>
              <div className="flex gap-2">
                {storyPreview ? (
                  <>
                    <button
                      onClick={() => setShowStoryModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📖 Bekijk verhaal
                    </button>
                    <button
                      onClick={handleEditStory}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Bewerken
                    </button>
                    <button
                      onClick={handleUpdateStory}
                      disabled={isGeneratingStory}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      🔄 {isGeneratingStory ? 'Bijwerken...' : 'Bijwerken'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateStoryPreview}
                    disabled={isGeneratingStory || answeredQuestionsCount < 3}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    ✨ {isGeneratingStory ? 'Genereren...' : 'Genereer verhaal'}
                  </button>
                )}
              </div>
            </div>

            {!storyPreview ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Je hebt nog geen verhaalvoorbeeld. Genereer eerst een preview van je verhaal om te zien hoe het wordt.
                </p>
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400 mb-4">
                  <div className="flex items-start">
                    <span className="text-yellow-600 mr-2">💡</span>
                    <div>
                      <p className="text-sm text-yellow-800">
                        <strong>Tip:</strong> Zorg dat je ten minste 3-5 vragen hebt beantwoord voordat je een verhaal genereert. Hoe meer je deelt, hoe rijker je verhaal wordt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                {storyPreview}
              </div>
            )}
          </div>

          {/* Story Modal */}
          {showStoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-xl font-semibold">
                    {editingStory ? 'Verhaal bewerken' : 'Je verhaal preview'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowStoryModal(false);
                      if (editingStory) {
                        handleCancelStoryEdit();
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {editingStory ? (
                  // Edit mode
                  <div className="p-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bewerk je verhaal:
                      </label>
                      <textarea
                        className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-serif text-base leading-relaxed"
                        value={editedStoryContent}
                        onChange={(e) => setEditedStoryContent(e.target.value)}
                        placeholder="Bewerk hier je verhaal..."
                        disabled={savingStory}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleCancelStoryEdit}
                        disabled={savingStory}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={handleSaveStoryEdit}
                        disabled={savingStory || !editedStoryContent.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingStory ? 'Opslaan...' : 'Opslaan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                      <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {storyPreview}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={handleEditStory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ✏️ Bewerken
                      </button>
                      <button
                        onClick={handleUpdateStory}
                        disabled={isGeneratingStory}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        🔄 {isGeneratingStory ? 'Bijwerken...' : 'Bijwerken'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Story Edit Modal (when editing from preview section) */}
          {editingStory && !showStoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-xl font-semibold">Verhaal bewerken</h3>
                  <button
                    onClick={handleCancelStoryEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bewerk je verhaal:
                    </label>
                    <textarea
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-serif text-base leading-relaxed"
                      value={editedStoryContent}
                      onChange={(e) => setEditedStoryContent(e.target.value)}
                      placeholder="Bewerk hier je verhaal..."
                      disabled={savingStory}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCancelStoryEdit}
                      disabled={savingStory}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleSaveStoryEdit}
                      disabled={savingStory || !editedStoryContent.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {savingStory ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Forward Question Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">📤 Vraag doorsturen</h3>
              <button
                onClick={() => setShowForwardModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Stuur deze vraag door naar een teamlid om te beantwoorden.
              </p>
              
              {teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{member.name}</h4>
                          {member.phone_number && (
                            <p className="text-sm text-gray-600">📱 {member.phone_number}</p>
                          )}
                          {member.email && (
                            <p className="text-sm text-gray-600">📧 {member.email}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {member.phone_number && (
                            <button
                              onClick={() => handleForwardQuestion(showForwardModal, member.id, 'whatsapp')}
                              disabled={sendingQuestionId === showForwardModal}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {sendingQuestionId === showForwardModal ? '📱...' : '📱 WhatsApp'}
                            </button>
                          )}
                          {member.email && (
                            <button
                              onClick={() => handleForwardQuestion(showForwardModal, member.id, 'email')}
                              disabled={sendingQuestionId === showForwardModal}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {sendingQuestionId === showForwardModal ? '📧...' : '📧 E-mail'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">👥</div>
                  <p className="text-gray-500 mb-4">Geen teamleden beschikbaar</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Je hebt nog geen teamleden toegevoegd om vragen naar door te sturen.
                  </p>
                  <p className="text-xs text-gray-400">
                    Voeg eerst teamleden toe via de API of database om deze functie te gebruiken.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </ProtectedRoute>
  );
}