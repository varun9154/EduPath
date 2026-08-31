'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Sparkles, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import statesData from '@/data/states.json';
import coursesData from '@/data/courses.json';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourse?: string;
}

export default function DemoModal({ isOpen, onClose, defaultCourse }: DemoModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    educationLevel: '12th Appearing',
    stream: 'Science (PCM)',
    state: 'Karnataka',
    interestedCourse: defaultCourse || 'B.Pharm (Bachelor of Pharmacy)',
    careerGoal: 'Pharma Industry QA/QC & Regulatory Affairs',
    entranceExam: 'KCET',
    counsellingMode: 'Online Video Call',
    preferredDate: '',
    preferredTimeSlot: '10:00 AM – 10:30 AM'
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
        setErrorMessage('Please complete Name, Email, and Mobile number.');
        return;
      }
    }
    if (step < 10) {
      // Give the date step a sensible default without calling impure
      // browser time APIs during render. The value is generated in the
      // button event handler, which is allowed to read the current time.
      if (step === 8 && !formData.preferredDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          preferredDate: tomorrow.toISOString().split('T')[0],
        }));
      }

      setStep(prev => prev + 1);
    } else if (step === 10) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessData(data.data);
        setStep(11); // Step 11: Confirmation
      } else {
        setErrorMessage(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeSlotOptions = [
    '09:00 AM – 09:30 AM',
    '10:00 AM – 10:30 AM',
    '11:00 AM – 11:30 AM',
    '12:00 PM – 12:30 PM',
    '02:00 PM – 02:30 PM',
    '03:00 PM – 03:30 PM',
    '04:00 PM – 04:30 PM',
    '05:00 PM – 05:30 PM',
    '06:00 PM – 06:30 PM',
    '07:00 PM – 07:30 PM',
    '08:00 PM – 08:30 PM'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-bold">Book a FREE EduPath Demo</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        {step <= 10 && (
          <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Step {step} of 10</span>
              <span>{Math.round((step / 10) * 100)}% Completed</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300 ease-out"
                style={{ width: `${(step / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 1: Contact Information</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Sharma"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. rohan.sharma@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Education Level */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 2: Education Level</h4>
              <div className="grid grid-cols-1 gap-2">
                {['12th Appearing', '12th Passed', '10th Passed', 'Diploma Student', 'Undergraduate (Pursuing Degree)'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleChange('educationLevel', lvl)}
                    className={`px-4 py-3 text-left text-sm rounded-lg border font-medium transition ${
                      formData.educationLevel === lvl
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Stream */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 3: Academic Stream</h4>
              <div className="grid grid-cols-1 gap-2">
                {['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities'].map((str) => (
                  <button
                    key={str}
                    onClick={() => handleChange('stream', str)}
                    className={`px-4 py-3 text-left text-sm rounded-lg border font-medium transition ${
                      formData.stream === str
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {str}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: State */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 4: Your State / Union Territory</h4>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {statesData.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} ({s.type})</option>
                ))}
              </select>
            </div>
          )}

          {/* STEP 5: Interested Course */}
          {step === 5 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 5: Interested Course / Degree</h4>
              <div className="grid grid-cols-1 gap-2">
                {coursesData.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleChange('interestedCourse', c.name)}
                    className={`px-4 py-2.5 text-left text-sm rounded-lg border font-medium transition ${
                      formData.interestedCourse === c.name
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.category} • {c.duration}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Career Goal */}
          {step === 6 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 6: Career Goal</h4>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Pharma QA Manager, Clinical Pharmacist"
                value={formData.careerGoal}
                onChange={(e) => handleChange('careerGoal', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}

          {/* STEP 7: Entrance Exam */}
          {step === 7 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 7: Target Entrance Exam</h4>
              <input
                type="text"
                placeholder="e.g. KCET, MHT-CET, WBJEE, JEE Main, NEET-UG, CUET"
                value={formData.entranceExam}
                onChange={(e) => handleChange('entranceExam', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}

          {/* STEP 8: Counselling Mode */}
          {step === 8 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 8: Preferred Counselling Mode</h4>
              <div className="grid grid-cols-1 gap-2">
                {['Online Video Call', 'Phone Call', 'WhatsApp Session'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleChange('counsellingMode', mode)}
                    className={`px-4 py-3 text-left text-sm rounded-lg border font-medium transition ${
                      formData.counsellingMode === mode
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: Date Selection */}
          {step === 9 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 9: Preferred Date</h4>
              <input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleChange('preferredDate', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}

          {/* STEP 10: Time Slot Selection */}
          {step === 10 && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Step 10: Preferred Time Slot</h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlotOptions.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleChange('preferredTimeSlot', slot)}
                    className={`px-3 py-2.5 text-center text-xs rounded-lg border font-semibold transition ${
                      formData.preferredTimeSlot === slot
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11: Confirmation Screen */}
          {step === 11 && successData && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Your Free EduPath Demo Request Has Been Received 🎉</h3>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center text-amber-800">
                  <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                  REQUEST RECEIVED (Pending Confirmation)
                </div>
                <p>Your requested slot is pending confirmation. Our counsellor will contact you.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-sm text-slate-700">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Booking ID:</span>
                  <span className="font-bold text-brand-600">{successData.bookingId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Student ID:</span>
                  <span className="font-semibold text-slate-800">{successData.studentId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Selected Goal:</span>
                  <span className="font-semibold text-slate-800">{successData.interestedCourse}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-slate-500">Requested Slot:</span>
                  <span className="font-semibold text-slate-800">{successData.preferredDate} ({successData.preferredTimeSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Counselling Mode:</span>
                  <span className="font-semibold text-slate-800">{successData.counsellingMode}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-lg shadow-brand-500/25"
              >
                Return to Website
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step <= 10 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : step === 10 ? 'Submit Demo Request' : 'Next Step'}
              {!loading && step < 10 && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
