import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Stethoscope, Clock, CheckCheck, X, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { DirectMessage } from '../../types';
import { useToast } from '../common/Toast';

interface DoctorChatPanelProps {
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  className?: string;
  isDrawer?: boolean;
  onClose?: () => void;
}

export const DoctorChatPanel: React.FC<DoctorChatPanelProps> = ({
  patientId,
  patientName,
  doctorId,
  doctorName = 'Connected Doctor',
  doctorSpecialty = 'Consultant Physician',
  doctorHospital,
  className = '',
  isDrawer = false,
  onClose
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!patientId || !doctorId) return;
    try {
      const msgs = await storageService.getDirectMessages(patientId, doctorId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [patientId, doctorId]);

  useEffect(() => {
    if (patientId && doctorId) {
      storageService.markMessagesRead(patientId, doctorId, patientId);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, patientId, doctorId]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride || inputMessage).trim();
    if (!text || !patientId || !doctorId) return;

    setIsSending(true);
    try {
      const newMsg = await storageService.sendDirectMessage({
        patientId,
        doctorId,
        senderId: patientId,
        senderName: patientName,
        senderRole: 'patient',
        recipientId: doctorId,
        recipientName: doctorName,
        message: text
      });
      setMessages(prev => [...prev, newMsg]);
      setInputMessage('');
      showToast('Message sent to doctor.', 'success');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error(err);
      showToast('Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!doctorId) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 text-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800">No Doctor Connected</h4>
        <p className="text-2xs text-slate-500 mt-1">
          Connect with a doctor in the My Doctors section to message your physician directly.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {doctorName.charAt(4) || 'D'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 truncate">{doctorName}</h4>
              <span className="text-3xs font-semibold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                Doctor
              </span>
            </div>
            <p className="text-3xs text-slate-500 truncate">
              {doctorSpecialty}{doctorHospital ? ` · ${doctorHospital}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-3xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Single Chat
          </span>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="px-3 py-1.5 bg-slate-100/50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-3xs">
        <span className="font-semibold text-slate-500 shrink-0">Quick ask:</span>
        {[
          "I uploaded a new report for review.",
          "Can I take medications before my test?",
          "When should I schedule my next visit?"
        ].map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(preset)}
            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 whitespace-nowrap transition-colors font-medium shrink-0 shadow-2xs"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Message History Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/30 min-h-[220px] max-h-[360px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-2xs font-semibold text-slate-800">Start Consultation Chat</p>
            <p className="text-3xs text-slate-500 mt-0.5 max-w-xs">
              Send a message to your doctor. All messages and replies are saved securely in your clinical history.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isPatient = msg.senderRole === 'patient';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 px-1 mb-0.5 text-3xs font-mono text-slate-400">
                  <span className={`font-semibold ${isPatient ? 'text-teal-700' : 'text-slate-700'}`}>
                    {isPatient ? 'You' : msg.senderName}
                  </span>
                  <span>·</span>
                  <span>{msg.timestamp || 'Just now'}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isPatient
                      ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder={`Message ${doctorName}...`}
          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0"
          title="Send Message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
