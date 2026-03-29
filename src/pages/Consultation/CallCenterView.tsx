import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchSpecialists } from '@/redux/slices/specialistSlice';
import { StarIcon, VideoIcon, MessageIcon, CallCenterIcon } from '@/design-system/icons';
import { BottomSheet, Button } from '@/components/ui';
import type { Professional } from '@/design-system/types';

const CallCenterView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'Doctor' | 'Nutritionist' | 'Support'>('Doctor');
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedMode, setSelectedMode] = useState<'Text' | 'Audio' | 'Video' | null>(null);

  // Get specialists from Redux
  const { specialists, loading } = useSelector((state: RootState) => state.specialists);

  useEffect(() => {
    dispatch(fetchSpecialists({ page: 1, limit: 10 }));
  }, [dispatch]);

  // Transform backend specialists to match UI format
  const professionals: Professional[] = specialists.map(s => {
    // Map backend role to UI type
    const roleToType = (role: string): 'Doctor' | 'Nutritionist' => {
      if (role === 'NUTRITIONIST') return 'Nutritionist';
      return 'Doctor'; // PEDIATRICIAN, CULINARIAN, etc. map to Doctor
    };

    return {
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Specialist',
      title: s.SpecialistProfile?.specialty || roleToType(s.role),
      type: roleToType(s.role),
      image: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
      availability: 'Available for booking',
      rating: 4.8, // Backend doesn't have rating, using default
      fee: 350, // Default fee, can be updated when backend supports it
      specialty: s.SpecialistProfile?.specialty || 'Child Care',
    };
  });

  const handleBookConsultation = () => {
    if (selectedPro && selectedMode) {
      // Navigate to existing chat or video call based on mode
      if (selectedMode === 'Text') {
        navigate(`/chat/${selectedPro.id}`);
      } else if (selectedMode === 'Video') {
        navigate('/video-call');
      } else {
        // For audio, use video call screen
        navigate('/video-call');
      }
      setSelectedPro(null);
      setSelectedMode(null);
    }
  };

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Expert Care</h2>
        <p className="text-slate-500 text-sm">Consult with verified child experts.</p>
      </div>

      <div className="px-6 flex gap-2 mb-10">
        {(['Doctor', 'Nutritionist', 'Support'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase transition-all ${
              activeTab === type ? 'bg-purple-500 text-white shadow-xl shadow-purple-100' : 'bg-white border border-slate-100 text-slate-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {activeTab === 'Support' ? (
        <div className="px-6 animate-in fade-in slide-in-from-bottom">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-purple-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-inner">🎧</div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 leading-tight">Instant App Help</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Talk to our customer success team for any technical or general app queries. No booking needed.</p>
            <div className="flex flex-col gap-4 w-full">
              <Button
                color="purple"
                fullWidth
                size="lg"
                onClick={() => navigate('/chat/support')}
              >
                Instant Live Chat
              </Button>
              <Button
                color="slate"
                fullWidth
                size="lg"
              >
                Emergency Audio Call
              </Button>
            </div>
          </div>
        </div>
      ) : loading && professionals.length === 0 ? (
        <div className="px-6 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Loading specialists...</p>
          </div>
        </div>
      ) : professionals.filter(p => p.type === activeTab).length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <p className="text-slate-600 font-bold mb-2">No {activeTab}s Available</p>
          <p className="text-slate-400 text-sm">Please check back later for available specialists.</p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {professionals.filter(p => p.type === activeTab).map(pro => (
            <div key={pro.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm">
              <div className="flex gap-5 mb-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] overflow-hidden flex-shrink-0 border-4 border-white shadow-sm">
                  <img src={pro.image} className="w-full h-full object-cover" alt={pro.name} />
                </div>
                <div className="flex-1 py-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{pro.name}</h4>
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      <StarIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black">{pro.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-500 font-black mb-2 uppercase tracking-widest mt-1">{pro.title}</p>
                  <div className="inline-flex px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100 tracking-tighter">
                    {pro.specialty}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Fee</span>
                  <span className="text-xl font-black text-slate-900">{pro.fee} <span className="text-[10px] font-bold">ETB</span></span>
                </div>
                <button
                  onClick={() => setSelectedPro(pro)}
                  className="px-8 py-4 bg-purple-500 text-white font-black rounded-[1.5rem] text-xs shadow-xl shadow-purple-50 active:scale-95 transition-transform"
                >
                  Check Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedPro}
        onClose={() => {
          setSelectedPro(null);
          setSelectedMode(null);
        }}
      >
        {selectedPro && (
          <>
            <div className="flex flex-col items-center mb-10">
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden mb-6 border-4 border-slate-50 shadow-md">
                <img src={selectedPro.image} className="w-full h-full object-cover" alt={selectedPro.name} />
              </div>
              <h2 className="text-3xl font-black text-slate-800">{selectedPro.name}</h2>
              <p className="text-sm font-black text-purple-500 uppercase tracking-[0.2em] mt-1">{selectedPro.title}</p>
              <div className="mt-6 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 border border-slate-100 tracking-wider">
                OFFICE HOURS: {selectedPro.availability}
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest px-2">Communication Mode</h4>
              <div className="grid grid-cols-3 gap-4">
                {(['Text', 'Audio', 'Video'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all group active:scale-95 ${
                      selectedMode === mode
                        ? 'border-purple-500 bg-purple-50'
                        : 'bg-slate-50 border-transparent hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className={`transition-colors ${
                      selectedMode === mode ? 'text-purple-500' : 'text-slate-400 group-hover:text-purple-500'
                    }`}>
                      {mode === 'Text' ? <MessageIcon /> : mode === 'Audio' ? <CallCenterIcon className="w-5 h-5" /> : <VideoIcon />}
                    </div>
                    <span className={`text-[10px] font-black uppercase ${
                      selectedMode === mode ? 'text-purple-600' : 'text-slate-500 group-hover:text-purple-600'
                    }`}>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedPro(null);
                  setSelectedMode(null);
                }}
                className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest"
              >
                Back
              </button>
              <Button
                color="purple"
                size="lg"
                className="flex-[2]"
                disabled={!selectedMode}
                onClick={handleBookConsultation}
              >
                Confirm & Book
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
};

export default CallCenterView;
