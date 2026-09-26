import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { Report, Alert, ChatMessage } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';

const SUGGESTED_QUESTIONS = [
  'What changed in my recent reports?',
  'Show my glucose history.',
  'Which values were abnormal?',
  'Explain hemoglobin in simple language.',
  'Summarize my latest report.',
  'Compare my last two reports.'
];

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Modal to inspect cited report
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  useEffect(() => {
    setReports(storageService.getReports());
    setAlerts(storageService.getAlerts());
    setMessages(storageService.getChatHistory());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    storageService.saveChatMessage(userMsg);
    setInputPrompt('');
    setIsTyping(true);

    // AI rule-based clinical response generator
    setTimeout(() => {
      const result = aiService.answerReportQuestion(text, reports, alerts);

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedReportId: result.relatedReportId,
        relatedReportTitle: result.relatedReportTitle,
        relatedReportDate: result.relatedReportDate,
        evidence: result.evidence.join(' · ')
      };

      const finalMessages = [...updated, aiMsg];
      setMessages(finalMessages);
      storageService.saveChatMessage(aiMsg);
      setIsTyping(false);
    }, 450);
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      storageService.clearChatHistory();
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[550px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 leading-none">
                Ask My Reports · Clinical Assistant
              </h2>
              <span className="text-3xs font-mono px-2 py-0.5 rounded bg-teal-100/70 text-teal-800 font-semibold">
                {reports.length} Reports Indexed
              </span>
            </div>
            <p className="text-2xs text-slate-500 mt-1">
              Grounded AI clinical assistant answering directly from your authenticated lab results
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Questions Ribbon */}
      <div className="px-6 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-2xs">
        <span className="font-semibold text-slate-500 shrink-0">Try asking:</span>
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 whitespace-nowrap shadow-2xs transition-colors shrink-0 font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-2xs text-teal-700 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MedPulse Clinical Intelligence</span>
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Evidence & Related Report Citation */}
                {msg.relatedReportId && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5 text-2xs">
                    {msg.evidence && (
                      <div className="text-slate-500 font-mono text-3xs">
                        <span className="font-semibold text-slate-700">Clinical Evidence:</span> {msg.evidence}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-mono">
                        Source: {msg.relatedReportTitle} ({msg.relatedReportDate})
                      </span>
                      <button
                        onClick={() => {
                          const r = storageService.getReportById(msg.relatedReportId!);
                          if (r) setViewingReport(r);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline"
                      >
                        View Report <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-3xs text-slate-400 mt-1 font-mono px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl text-xs text-slate-500 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            <span>Analyzing indexed test parameters & clinical reference intervals...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Informational Disclaimer */}
      <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 text-3xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Informational summary synthesized from your lab records. Does not replace professional clinical diagnosis.
        </span>
        <span className="font-mono">Rule-based Intelligence Layer</span>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          placeholder="Ask a question about your lab reports, trends, or abnormal values..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-500"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isTyping}
          className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Modal for viewing cited report */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
