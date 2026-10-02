import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  Loader2, 
  Plus, 
  Trash2, 
  Sparkles,
  Info
} from 'lucide-react';
import { Report, LabResult, Alert } from '../../types';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReport: Report) => void;
  patientId?: string; // Optional for backward compatibility if needed, but we will pass it
}

type Step = 'select' | 'processing' | 'verify' | 'done';

const PROCESSING_STEPS = [
  'Uploading medical document file...',
  'Reading optical layer & document layout...',
  'Extracting textual lab sections...',
  'Identifying medical test biomarkers & units...',
  'Validating extracted numerical parameters against clinical ranges...',
  'Structuring health record payload...'
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess, patientId }) => {
  const { user } = useAuth(); // We need useAuth to get current user ID if patientId is not provided
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progressStage, setProgressStage] = useState(0);

  // Form & extracted fields
  const [reportTitle, setReportTitle] = useState('');
  const [category, setCategory] = useState<Report['category']>('Hematology');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hospitalOrLab, setHospitalOrLab] = useState('Apollo Diagnostic Lab');
  const [extractedValues, setExtractedValues] = useState<LabResult[]>([]);
  const [rawText, setRawText] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
      showToast('Please upload a valid PDF, JPG, or PNG document.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds the 10 MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    startOcrSimulation(file);
  };

  const startOcrSimulation = async (file: File) => {
    setStep('processing');
    setProgressStage(0);

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setReportTitle(cleanName.length > 5 ? cleanName : 'Comprehensive Health Diagnostics Report');

    // Simulate progress bar while uploading & processing
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < PROCESSING_STEPS.length - 1) {
        setProgressStage(current);
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // We use standard fetch, not our fetchApi because it's multipart/form-data
      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      clearInterval(interval);
      setProgressStage(PROCESSING_STEPS.length - 1);
      
      // Auto-assign properties using biomarker intelligence
      let initialValues: LabResult[] = data.extractedValues.map((val: any, idx: number) => {
        const parsed = aiService.parseBiomarkerRange(val.testName || 'Unknown Test', val.referenceRange || '', Number(val.value) || 0);
        return {
          id: `t-${Date.now()}-${idx}`,
          testName: val.testName || 'Unknown Test',
          value: Number(val.value) || 0,
          unit: val.unit || '',
          referenceRange: parsed.referenceRange,
          minRange: parsed.minRange,
          maxRange: parsed.maxRange,
          status: parsed.status,
          category: 'General'
        };
      });

      // A simple parse to try to guess category from title
      const fn = file.name.toLowerCase();
      let detectedCategory: Report['category'] = 'Hematology';
      if (fn.includes('sugar') || fn.includes('glucose') || fn.includes('metabolic')) detectedCategory = 'Biochemistry';
      else if (fn.includes('lipid') || fn.includes('cholesterol')) detectedCategory = 'Lipid Panel';
      else if (fn.includes('thyroid')) detectedCategory = 'Thyroid';
      
      initialValues.forEach(v => v.category = detectedCategory);

      setCategory(detectedCategory);
      setExtractedValues(initialValues);
      setRawText(data.text || '');
      setStep('verify');

    } catch (err) {
      clearInterval(interval);
      showToast('Error during OCR processing. Please try again.', 'error');
      setStep('select');
    }
  };

  const handleUpdateValue = (index: number, field: keyof LabResult, val: any) => {
    const updated = [...extractedValues];
    updated[index] = { ...updated[index], [field]: val };

    // Auto update status if value, minRange, or maxRange changed
    if (field === 'value' || field === 'minRange' || field === 'maxRange') {
      const numVal = parseFloat(field === 'value' ? val : updated[index].value) || 0;
      const min = parseFloat(field === 'minRange' ? val : updated[index].minRange) || 0;
      const max = parseFloat(field === 'maxRange' ? val : updated[index].maxRange) || 999999;
      if (numVal < min) {
        updated[index].status = (min > 0 && numVal < min * 0.75) ? 'critical' : 'low';
      } else if (numVal > max) {
        updated[index].status = (max < 999999 && numVal > max * 1.3) ? 'critical' : 'high';
      } else {
        updated[index].status = 'normal';
      }
    } else if (field === 'referenceRange') {
      const parsed = aiService.parseBiomarkerRange(updated[index].testName, val, updated[index].value);
      updated[index].minRange = parsed.minRange;
      updated[index].maxRange = parsed.maxRange;
      updated[index].status = parsed.status;
    }

    setExtractedValues(updated);
  };

  const handleAddTestRow = () => {
    const newRow: LabResult = {
      id: `t-${Date.now()}`,
      testName: 'New Test Parameter',
      value: 100,
      unit: 'mg/dL',
      referenceRange: '70 - 110',
      minRange: 70,
      maxRange: 110,
      status: 'normal',
      category
    };
    setExtractedValues([...extractedValues, newRow]);
  };

  const handleRemoveTestRow = (index: number) => {
    setExtractedValues(extractedValues.filter((_, i) => i !== index));
  };

  const handleFinalSave = async () => {
    if (!reportTitle.trim()) {
      showToast('Please provide a title for the report.', 'error');
      return;
    }
    if (extractedValues.length === 0) {
      showToast('At least one laboratory test parameter is required.', 'error');
      return;
    }

    const targetPatientId = patientId || user?.id || '';

    const newReport: Report = {
      id: `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patientId: targetPatientId,
      title: reportTitle.trim(),
      category,
      date: reportDate,
      uploadedBy: user?.name || 'Patient',
      doctorName: user?.role === 'doctor' ? user.name : '',
      hospitalOrLab: hospitalOrLab.trim() || 'Diagnostics Centre',
      fileName: selectedFile?.name || 'Uploaded_Medical_Report.pdf',
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      extractedValues,
      rawText: rawText.trim(),
      status: extractedValues.some(v => v.status !== 'normal') ? 'flagged' : 'verified',
      notes: notes.trim(),
      aiSummary: '',
      isSharedWithDoctor: false
    };

    // Synthesize instant AI summary based on values
    try {
      newReport.aiSummary = await aiService.generateReportSummaryAsync(newReport.extractedValues);
    } catch(e) {
      newReport.aiSummary = 'AI Summary could not be generated.';
    }

    // Save report into database / storage
    const saved = storageService.saveReport(newReport);

    // If report contains abnormal/flagged values, create clinical alerts with AI drafting & previous value comparison
    const abnormalValues = extractedValues.filter(v => v.status !== 'normal');
    if (abnormalValues.length > 0) {
      // Fetch historical reports for target patient to find previous biomarker readings
      const patientHistoricalReports = storageService.getReports(targetPatientId)
        .filter(r => r.id !== newReport.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const targetPatient = storageService.getUsers().find(u => u.id === targetPatientId);
      const patientName = targetPatient?.name || (user?.role === 'patient' ? user.name : 'Patient');

      await Promise.all(abnormalValues.map(async (val, idx) => {
        let prevValue: number | null = null;
        let prevDate: string | undefined = undefined;

        const normMetric = (val.testName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const prevRep of patientHistoricalReports) {
          const match = (prevRep.extractedValues || []).find(v => {
            const vm = (v.testName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return vm === normMetric || vm.includes(normMetric) || normMetric.includes(vm);
          });
          if (match) {
            prevValue = match.value;
            prevDate = prevRep.date;
            break;
          }
        }

        const isCritical = val.status === 'critical' || 
          (val.minRange > 0 && val.value < val.minRange * 0.75) || 
          (val.maxRange < 999999 && val.value > val.maxRange * 1.3);

        // AI drafts the alert content (patient message, reasons, control measures, doctor summary, change description)
        const aiDraft = await aiService.draftBiomarkerAlertAsync({
          metric: val.testName,
          currentValue: val.value,
          previousValue: prevValue,
          previousDate: prevDate,
          unit: val.unit,
          referenceRange: val.referenceRange,
          status: val.status,
          reportTitle: newReport.title,
          patientName
        });

        const alert: Alert = {
          id: `ALT-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
          patientId: targetPatientId,
          patientName,
          reportId: newReport.id,
          sourceReportTitle: newReport.title,
          metric: val.testName,
          value: val.value,
          previousValue: prevValue,
          previousDate: prevDate,
          changeDescription: aiDraft.changeDescription,
          unit: val.unit,
          referenceRange: val.referenceRange,
          date: newReport.date,
          severity: isCritical ? 'high' : 'medium',
          type: val.status === 'low' ? 'below_range' : 'above_range',
          status: 'active',
          aiMessage: aiDraft.patientMessage,
          aiReasons: aiDraft.possibleReasons,
          aiControlMeasures: aiDraft.controlMeasures,
          aiDoctorSummary: aiDraft.doctorSummary
        };
        storageService.addAlert(alert);
      }));

      // Notify patient of abnormal results
      storageService.addNotification({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: targetPatientId,
        role: 'patient',
        title: 'Clinical Biomarker Alert Detected',
        message: `"${newReport.title}" contains ${abnormalValues.length} flagged biomarker parameter(s) requiring attention: ${abnormalValues.map(v => v.testName).join(', ')}.`,
        date: newReport.date,
        read: false,
        link: '/patient/alerts',
        type: 'abnormal_alert'
      });
    }

    // If patient uploaded report, notify any actively connected doctors
    if (user?.role === 'patient') {
      const activeConnections = storageService.getConnections().filter(
        c => c.status === 'connected' && (c.patientId.toLowerCase() === user.id.toLowerCase() || !c.patientId)
      );
      activeConnections.forEach(conn => {
        storageService.addNotification({
          id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userId: conn.doctorId,
          role: 'doctor',
          title: abnormalValues.length > 0 ? 'Abnormal Biomarker Finding Flagged' : 'Patient Uploaded New Lab Report',
          message: abnormalValues.length > 0
            ? `Patient ${user.name} uploaded "${newReport.title}" with ${abnormalValues.length} out-of-range finding(s): ${abnormalValues.map(v => v.testName).join(', ')}.`
            : `Patient ${user.name} uploaded new diagnostic report "${newReport.title}".`,
          date: newReport.date,
          read: false,
          link: abnormalValues.length > 0 ? '/doctor/alerts' : `/doctor/patients/${user.id}`,
          type: abnormalValues.length > 0 ? 'abnormal_alert' : 'report_shared'
        });
      });
    }

    showToast(`"${newReport.title}" verified and saved. ${abnormalValues.length > 0 ? `${abnormalValues.length} biomarker alert(s) generated.` : ''}`, 'success');
    onSuccess(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {step === 'select' && 'Upload Medical Report'}
                {step === 'processing' && 'Simulating OCR Document Extraction'}
                {step === 'verify' && 'Verify & Structure Extracted Health Data'}
              </h2>
              <p className="text-2xs text-slate-500">
                Supported formats: PDF, JPG, PNG (Max 10 MB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: SELECT / DRAG & DROP */}
          {step === 'select' && (
            <div className="space-y-4">
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900 mb-1">
                  Click to browse or drag and drop file here
                </h3>
                <p className="text-2xs text-slate-500 max-w-sm mx-auto">
                  Upload lab reports, discharge summaries, blood test panels, or diagnostic prescriptions.
                </p>
              </div>

              {/* Sample files shortcut for demo */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-2xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Or select a demo document to simulate:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const file = new File(['mock content'], 'Diabetic_Metabolic_Profile.pdf', { type: 'application/pdf' });
                      processSelectedFile(file);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-2xs font-medium text-slate-900 truncate">Glucose & HbA1c</span>
                    </div>
                    <span className="text-2xs text-slate-400">PDF · 940 KB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const file = new File(['mock content'], 'Followup_CBC_Hematology.pdf', { type: 'application/pdf' });
                      processSelectedFile(file);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-2xs font-medium text-slate-900 truncate">Complete Blood Count</span>
                    </div>
                    <span className="text-2xs text-slate-400">PDF · 1.2 MB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const file = new File(['mock content'], 'Lipid_Panel_Cardio.pdf', { type: 'application/pdf' });
                      processSelectedFile(file);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-2xs font-medium text-slate-900 truncate">Lipid & Cholesterol</span>
                    </div>
                    <span className="text-2xs text-slate-400">PDF · 1.8 MB</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-2xs text-slate-600 border border-slate-100">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  OCR Extraction pipeline will automatically detect biomarkers, calculate abnormal boundaries, and update longitudinal trends upon verification.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING SIMULATION */}
          {step === 'processing' && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Sparkles className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Processing Medical Report Document
                </h3>
                <p className="text-2xs text-slate-500 font-mono mt-1">
                  {selectedFile?.name}
                </p>
              </div>

              {/* Progress checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 max-w-md mx-auto text-xs">
                {PROCESSING_STEPS.map((s, idx) => {
                  const isDone = idx < progressStage;
                  const isCurrent = idx === progressStage;
                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-3 transition-colors ${
                        isDone
                          ? 'text-teal-700 font-medium'
                          : isCurrent
                          ? 'text-slate-900 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: VERIFY & EDIT EXTRACTED DATA */}
          {step === 'verify' && (
            <div className="space-y-4">
              {/* Document metadata fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Report['category'])}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  >
                    <option value="Hematology">Hematology (CBC / Blood)</option>
                    <option value="Biochemistry">Biochemistry (Glucose, Kidney, Liver)</option>
                    <option value="Lipid Panel">Lipid & Cholesterol</option>
                    <option value="Thyroid">Thyroid Function</option>
                    <option value="General">General Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">
                    Collection / Report Date
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">
                    Diagnostic Lab / Clinic
                  </label>
                  <input
                    type="text"
                    value={hospitalOrLab}
                    onChange={e => setHospitalOrLab(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Extracted Lab Results Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Extracted Biomarkers ({extractedValues.length})
                    </span>
                    <span className="text-2xs text-slate-400">
                      Verify & adjust values before saving
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTestRow}
                    className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Test
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Test Name</th>
                          <th className="py-2 px-3 font-semibold text-right">Value</th>
                          <th className="py-2 px-2 font-semibold">Unit</th>
                          <th className="py-2 px-3 font-semibold">Reference Range</th>
                          <th className="py-2 px-2 font-semibold">Status</th>
                          <th className="py-2 px-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedValues.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.testName}
                                onChange={e => handleUpdateValue(idx, 'testName', e.target.value)}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                value={row.value}
                                onChange={e => handleUpdateValue(idx, 'value', e.target.value)}
                                className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs text-slate-900 text-right font-mono tabular-nums font-semibold"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={row.unit}
                                onChange={e => handleUpdateValue(idx, 'unit', e.target.value)}
                                className="w-16 px-1.5 py-1 border border-slate-200 rounded text-2xs text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.referenceRange}
                                onChange={e => handleUpdateValue(idx, 'referenceRange', e.target.value)}
                                className="w-24 px-1.5 py-1 border border-slate-200 rounded text-2xs text-slate-600 font-mono"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={row.status}
                                onChange={e => handleUpdateValue(idx, 'status', e.target.value)}
                                className={`text-2xs font-bold uppercase rounded-md px-1.5 py-0.5 border cursor-pointer ${
                                  row.status === 'normal'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : row.status === 'low'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <option value="normal">NORMAL</option>
                                <option value="low">LOW</option>
                                <option value="high">HIGH</option>
                                <option value="critical">CRITICAL</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTestRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {extractedValues.some(v => v.status !== 'normal') && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-2xs text-amber-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Biomarker Surveillance Alert Notice:</span>
                      {extractedValues.filter(v => v.status !== 'normal').length} value(s) fall outside standard intervals ({extractedValues.filter(v => v.status !== 'normal').map(v => `${v.testName} (${v.value} ${v.unit})`).join(', ')}). 
                      Saving this report will auto-generate clinical alerts with historical value shift comparisons and AI draft guidance for both your and your physician's alert center.
                    </div>
                  </div>
                )}
              </div>

              {/* Full Extracted OCR Text Section */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Extracted Document Text (Full Text Format)</span>
                  </div>
                  <span className="text-2xs text-slate-500">
                    Stored for AI report queries & clinical text reference
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Complete text content extracted from document..."
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-teal-500 leading-relaxed resize-y"
                />
              </div>

              {/* Optional patient notes */}
              <div>
                <label className="block text-2xs font-medium text-slate-600 mb-1">
                  Optional Patient / Doctor Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Fasting sample taken in morning, following medication schedule..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            Cancel
          </button>

          {step === 'verify' && (
            <button
              type="button"
              onClick={handleFinalSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" /> Save Verified Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
