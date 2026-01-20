import React, { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    interestedIn: 'male',
    avatar: ''
  });

  const avatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80", // Female 1
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", // Female 2
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", // Male 1
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"  // Male 2
  ];

  const handleNext = () => {
    if (step === 3) {
      if (!formData.avatar) {
        onComplete({ ...formData, avatar: avatars[0] });
      } else {
        onComplete(formData);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Who are you?</h1>
            <p className="text-slate-500 mb-6">Let's calibrate simulation.</p>
            
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold text-lg mb-6"
              placeholder="e.g. Sarah"
            />

            <label className="block text-sm font-bold text-slate-700 mb-2">I identify as</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['female', 'male', 'non-binary'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({...formData, gender: g})}
                  className={`p-3 rounded-xl font-bold capitalize transition-all ${
                    formData.gender === g ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DESIRE */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Your Type?</h1>
            <p className="text-slate-500 mb-6">Who do you want to play with?</p>
            
            <div className="space-y-3">
              {[
                { id: 'male', label: 'Men', icon: '🧔🏻‍♂️' },
                { id: 'female', label: 'Women', icon: '👩🏼' },
                { id: 'everyone', label: 'Everyone', icon: '🌈' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({...formData, interestedIn: opt.id})}
                  className={`w-full p-4 rounded-xl font-bold flex items-center justify-between transition-all border-2 ${
                    formData.interestedIn === opt.id 
                      ? 'border-purple-600 bg-purple-50 text-purple-900' 
                      : 'border-transparent bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    {opt.label}
                  </span>
                  {formData.interestedIn === opt.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: VISUALS */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Choose your Look</h1>
            <p className="text-slate-500 mb-6">How do you appear in the simulation?</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {avatars.map((url, i) => (
                <div 
                  key={i}
                  onClick={() => setFormData({...formData, avatar: url})}
                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${
                    formData.avatar === url ? 'border-purple-600 scale-105' : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEXT BUTTON */}
        <button
          onClick={handleNext}
          disabled={!formData.name && step === 1}
          className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50"
        >
          {step === 3 ? 'ENTER SIMULATION' : 'CONTINUE'}
        </button>
      </div>
    </div>
  );
}
