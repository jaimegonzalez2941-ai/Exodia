import React, { useState } from 'react';
import { X, Send, Radio, CheckCircle2, AlertCircle, Sparkles, HelpCircle, Copy, Check } from 'lucide-react';
import { sendDiscordWebhook, createAnnouncementEmbed } from '../utils/discordEmbed';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  onSaveWebhookUrl,
}) => {
  const [urlInput, setUrlInput] = useState(webhookUrl);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedStep, setCopiedStep] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveWebhookUrl(urlInput.trim());
    setTestStatus({ type: 'success', message: 'Webhook URL saved! Ready to dispatch trial cards.' });
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestPing = async () => {
    const target = urlInput.trim();
    if (!target) {
      setTestStatus({ type: 'error', message: 'Please enter a webhook URL first.' });
      return;
    }

    setIsSending(true);
    setTestStatus(null);

    const res = await sendDiscordWebhook(target, {
      username: 'Academia Bot #0027',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
      content: '🟢 **LA ACADEMIA // DISCORD INTEGRATION VERIFIED**\nWebhook pipeline active. Connected to **LA ACADEMIA Pro Clubs Multiverse** (FC27). Ready to transmit trial cards and lineups.',
    });

    setIsSending(false);
    if (res.success) {
      setTestStatus({ type: 'success', message: 'Connected! Test message successfully delivered to your Discord channel.' });
      onSaveWebhookUrl(target);
    } else {
      setTestStatus({ type: 'error', message: res.message });
    }
  };

  const handleSendAnnouncement = async () => {
    const target = urlInput.trim();
    if (!target) {
      setTestStatus({ type: 'error', message: 'Please configure your Discord webhook URL first.' });
      return;
    }

    setIsSending(true);
    setTestStatus(null);

    const embed = createAnnouncementEmbed();
    const res = await sendDiscordWebhook(target, {
      username: 'Academia Bot #0027',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academia-bot',
      content: '🚨 @everyone **THE REBRAND IS LIVE** 🚨',
      embeds: [embed],
    });

    setIsSending(false);
    if (res.success) {
      setTestStatus({ type: 'success', message: 'Official Rebrand Announcement dispatched to your Discord channel!' });
      onSaveWebhookUrl(target);
    } else {
      setTestStatus({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-600/40 text-rose-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Connect Live Discord Webhook
            </h2>
            <p className="text-xs text-zinc-400">
              Transmit official trial cards, announcements, &amp; tactics directly into your Discord server in 30 seconds.
            </p>
          </div>
        </div>

        {/* Step-by-Step Visual Guide Collapsible */}
        <div className="mb-5 rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              How to get your Webhook URL (4 Easy Steps)
            </span>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer underline"
            >
              {showGuide ? 'Hide details' : 'Show details'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
              <strong className="text-white block mb-0.5">Step 1: Open Discord</strong>
              In your server, right-click the target channel (e.g. <span className="text-rose-400 font-mono">#trial-submission</span>) and click <strong>&quot;Edit Channel&quot;</strong>.
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
              <strong className="text-white block mb-0.5">Step 2: Go to Integrations</strong>
              In the channel settings menu, click <strong>&quot;Integrations&quot;</strong> &rarr; <strong>&quot;Webhooks&quot;</strong> &rarr; <strong>&quot;New Webhook&quot;</strong>.
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
              <strong className="text-white block mb-0.5">Step 3: Name &amp; Copy</strong>
              Name it <span className="text-rose-400 font-mono">Academia Bot</span>, select the channel, then click <strong>&quot;Copy Webhook URL&quot;</strong>.
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
              <strong className="text-white block mb-0.5">Step 4: Paste &amp; Test Below</strong>
              Paste the URL below and click <strong>&quot;Send Test Ping&quot;</strong>. Look at your Discord channel to see the instant live confirmation!
            </div>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
              <span>Discord Webhook URL</span>
              <span className="text-[10px] text-zinc-500 font-mono">Starts with https://discord.com/api/webhooks/...</span>
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://discord.com/api/webhooks/123456789012345678/abcdef..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                testStatus.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : 'bg-red-950/60 border-red-700/60 text-red-300'
              }`}
            >
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
            >
              Save URL
            </button>

            <button
              onClick={handleTestPing}
              disabled={isSending}
              className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Pinging...' : 'Send Test Ping to Server'}</span>
            </button>

            <button
              onClick={handleSendAnnouncement}
              disabled={isSending}
              className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Broadcast Official Rebrand Embed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
