import React from 'react';
import { useTranslation } from 'react-i18next';

interface TermsStepProps {
  onNext: () => void;
}

const TermsStep: React.FC<TermsStepProps> = ({ onNext }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 p-8 animate-in slide-in-from-right duration-500">
      <h2 className="text-2xl font-black mb-2 text-slate-900">{t('Terms of Agreement')}</h2>
      <p className="text-slate-500 text-sm mb-6">{t('Please read carefully before continuing.')}</p>

      <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 mb-8 overflow-y-auto border border-slate-100 shadow-inner">
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <h3 className="font-bold text-slate-800">{t('1. Data Usage')}</h3>
          <p>{t('Lije Care uses the child data provided (name, gender, birthdate) to calculate nutritional requirements and track developmental milestones based on international health standards.')}</p>

          <h3 className="font-bold text-slate-800">{t('2. Medical Advice')}</h3>
          <p>{t('The information provided in this app is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Always consult with a qualified health professional for medical concerns.')}</p>

          <h3 className="font-bold text-slate-800">{t('3. Privacy')}</h3>
          <p>{t("Your data is stored securely. We do not share your child's personal health information with third parties without your explicit consent. Telegram authentication ensures your account stays private.")}</p>

          <h3 className="font-bold text-slate-800">{t('4. Community Guidelines')}</h3>
          <p>{t('When using our consultation services, please maintain a respectful and professional interaction with doctors and nutritionists.')}</p>

          <h3 className="font-bold text-slate-800">{t('5. Updates')}</h3>
          <p>{t('We may update these terms periodically to reflect new features or regulatory changes. Continued use of the app implies acceptance of the updated terms.')}</p>

          <p className="italic pt-4 opacity-70">
            {t('By clicking continue, you acknowledge that you have read and understood the terms above.')}
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl shadow-sky-100 active:scale-95 transition-all"
      >
        {t('I Agree & Continue')}
      </button>
    </div>
  );
};

export default TermsStep;
