// @ts-ignore
import * as JoyridePkg from 'react-joyride';
import type { Step, TooltipRenderProps } from 'react-joyride';

let Joyride: any = JoyridePkg.default;
if (!Joyride || typeof Joyride !== 'function') {
  Joyride = Object.values(JoyridePkg).find(val => typeof val === 'function');
}

interface TutorialTourProps {
  run: boolean;
  onTourEnd: () => void;
}

//  PREMIUM GLASSMORPHIC TOOLTIP (Custom Design)
function CustomTooltip({
  index, step, tooltipProps, primaryProps, backProps, skipProps, isLastStep
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="w-80 bg-[#0f0c29]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-left flex flex-col gap-3"
    >
      <div>
        {step.title && <h3 className="text-white font-bold text-base mb-1.5">{step.title}</h3>}
        {step.content && <p className="text-white/60 text-xs leading-relaxed">{step.content}</p>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
        <button
          {...skipProps}
          className="text-[10px] font-medium text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
        >
          Skip Tour
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/80 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TutorialTour({ run, onTourEnd }: TutorialTourProps) {
  
const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to ZenStick! 🚀',
      content: "Let's take a quick tour of your new premium glassmorphic note-taking workspace.",
    },
    {
      target: '[data-tour="sidebar"]',
      placement: 'right',
      title: 'All Notes Sidebar 📂',
      content: 'Access all your saved notes here. The sidebar stays open as you browse, keeping your workflow uninterrupted.',
    },
    {
      target: '[data-tour="add-note"]',
      placement: 'bottom',
      title: 'Create New Note ➕',
      content: 'Click here to instantly create a new note. Pick an accent color from the spontaneous palette to organize your thoughts!',
    },
    {
      target: '[data-tour="sidebar-toggle"]',
      placement: 'bottom',
      title: 'Collapsible Sidebar 🛠️',
      content: 'Need more focus? Use this toggle to smoothly hide or reveal your sidebar anytime.',
    },
    {
      target: '[data-tour="editor-area"]',
      placement: 'center',
      title: 'The Professional Editor 📝',
      content: 'Your main canvas. Designed with an IDE-like spacious layout so you can write, code, and brainstorm without feeling cramped.',
    },
    {
      target: '[data-tour="launch-widget"]',
      placement: 'bottom',
      title: 'Launch Floating Widget 🛸',
      content: 'Our flagship feature! Detach your active note into a compact, floating desktop companion. Everything syncs in real-time!',
    },
    {
      target: '[data-tour="help-button"]',
      placement: 'bottom',
      title: 'Need Help Again? 🧭',
      content: 'Whenever you want to replay this tour or explore the features again, just click this guide button.',
    }
  ];

  const handleJoyrideCallback = (data: { status: string; type: string; action: string }) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      onTourEnd();
    }
  };

  if (!Joyride) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip} //  CUSTOM THEME INJECTED HERE
      floaterProps={{ disableAnimation: true }}
      styles={{
        options: {
          overlayColor: 'rgba(0, 0, 0, 0.7)', 
          zIndex: 10000,
        },
      }}
    />
  );
}