import React from 'react';
import { Radio, Plus, Download } from 'lucide-react';

interface NavigationProps {
  activeTab: 'simulator' | 'roles' | 'builder' | 'squad' | 'tactics' | 'bot-code' | 'analytics' | 'fc27-stats';
  setActiveTab: (tab: 'simulator' | 'roles' | 'builder' | 'squad' | 'tactics' | 'bot-code' | 'analytics' | 'fc27-stats') => void;
  openWebhookModal: () => void;
  hasWebhookConfigured: boolean;
  openBuilder: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  openWebhookModal,
  hasWebhookConfigured,
  openBuilder,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => setActiveTab('simulator')}
          className="text-left font-bold tracking-tight text-lg text-white hover:text-rose-400 transition-colors cursor-pointer"
        >
          La Academia // FC27
        </button>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Bot Simulator
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'roles'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Role Manager
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'builder'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Trial Cards
          </button>
          <button
            onClick={() => setActiveTab('squad')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'squad'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Squad Matrix
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span>Performance</span>
            <span className="text-[10px] px-1 rounded bg-rose-950 text-rose-400 font-mono font-bold border border-rose-800/40">30D</span>
          </button>
          <button
            onClick={() => setActiveTab('fc27-stats')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'fc27-stats'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <span>FC27 Stats</span>
            <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-800/40">API</span>
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'tactics'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Tactics
          </button>
          <button
            onClick={() => setActiveTab('bot-code')}
            className={`transition-colors pb-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'bot-code'
                ? 'text-rose-500 border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Discord Setup
          </button>
        </nav>

        {/* Zone 3: Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href="/api/download-zip"
            download="la-academia-fc27-deployment.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white transition-colors cursor-pointer shadow-sm"
            title="Download single deployment zip file for hosting platforms (Render, Railway, Docker, VPS)"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Hosting Zip</span>
          </a>

          <button
            onClick={openWebhookModal}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
              hasWebhookConfigured
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Configure real Discord Webhook URL for live server dispatch"
          >
            <Radio className={`w-3.5 h-3.5 ${hasWebhookConfigured ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">
              {hasWebhookConfigured ? 'Webhook Active' : 'Connect Webhook'}
            </span>
          </button>

          <button
            onClick={openBuilder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Trial Card</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="md:hidden flex overflow-x-auto border-t border-zinc-800 px-3 py-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'simulator' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Bot Simulator
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'roles' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'builder' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Trial Card
        </button>
        <button
          onClick={() => setActiveTab('squad')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'squad' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Squad Architecture
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'analytics' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('fc27-stats')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'fc27-stats' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          FC27 Stats
        </button>
        <button
          onClick={() => setActiveTab('tactics')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'tactics' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Tactics
        </button>
        <button
          onClick={() => setActiveTab('bot-code')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'bot-code' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400'}`}
        >
          Bot Code
        </button>
        <a
          href="/api/download-zip"
          download="la-academia-fc27-deployment.zip"
          className="px-3 py-1 rounded whitespace-nowrap bg-zinc-800 text-rose-400 border border-zinc-700 flex items-center gap-1 font-semibold"
        >
          <Download className="w-3 h-3" />
          <span>Hosting Zip</span>
        </a>
      </div>
    </header>
  );
};
