import React, { useState } from 'react';

export default function AccusationModal({ persona, onClose, onUnlock }) {
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [result, setResult] = useState(null); // 'correct' or 'wrong'

  // Simple Options
  const options = [
    { id: 'sociopath', label: 'He is Married', icon: '💍' },
    { id: 'stalker', label: 'He is a Stalker', icon: '👀' },
    { id: 'debtor', label: 'He is Broke', icon: '💸' }
  ];

  const handleGuess = () => {
    // Simple check
    const isMatch = persona.red_flag_title.toLowerCase().includes(selectedCrime);
    
    if (isMatch) {
      setResult('correct');
    } else {
      setResult('wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden relative">
        
        {/* HEADER */}
        <div className="bg-slate-800 p-6 text-center border-b border-slate-700">
          <div className="w-20 h-20 mx-auto rounded-full border-4 border-red-500 overflow-hidden mb-4">
            <img src={persona.avatar} className="w-full h-full object-cover" alt="suspect" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase">
            WHAT IS WRONG?
          </h2>
          <p className="text-slate-400 text-sm mt-2">Take a guess.</p>
        </div>

        {/* GUESSING PHASE */}
        {!result && (
          <div className="p-6 space-y-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedCrime(opt.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedCrime === opt.id 
                    ? 'border-red-500 bg-red-500/10 text-white' 
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-bold">{opt.label}</span>
              </button>
            ))}

            <button
              onClick={handleGuess}
              disabled={!selectedCrime}
              className="w-full mt-6 py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
            >
              CHECK ANSWER
            </button>

            <button onClick={onClose} className="w-full text-slate-500 text-sm py-2">
              Go back to chat
            </button>
          </div>
        )}

        {/* WIN STATE */}
        {result === 'correct' && (
          <div className="p-8 text-center animate-in zoom-in duration-300">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-3xl font-black text-green-500 mb-2">YOU GOT IT!</h2>
            <p className="text-white text-lg mb-6">
              He is a <span className="text-red-500 font-bold">{persona.red_flag_title}</span>.
            </p>
            <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-600">
              <p className="text-slate-300 italic">"{persona.red_flag_clue}"</p>
            </div>
            <button onClick={onClose} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">
              CLOSE
            </button>
          </div>
        )}

        {/* LOSE STATE (MONEY MAKER) */}
        {result === 'wrong' && (
          <div className="p-8 text-center animate-in shake duration-300">
            <div className="text-6xl mb-4">🤡</div>
            <h2 className="text-3xl font-black text-red-500 mb-2">WRONG.</h2>
            <p className="text-slate-300 mb-6">
              That's not it. Want to try again?
            </p>
            <button 
              onClick={() => setResult(null)} 
              className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl mb-3 hover:bg-slate-600"
            >
              TRY AGAIN ($0.99)
            </button>
             <button 
              onClick={onUnlock} 
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-xl"
            >
              SEE THE TRUTH ($2.99)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
