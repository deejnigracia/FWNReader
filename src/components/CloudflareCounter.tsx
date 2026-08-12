import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, Zap, Sliders, Play, RotateCcw, X, Shield } from 'lucide-react';
import { useCloudflareStore } from '../store/cloudflareStore';

interface CloudflareCounterProps {
  compact?: boolean;
}

export const CloudflareCounter: React.FC<CloudflareCounterProps> = ({ compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    totalRequests,
    blockedRequests,
    bypassedRequests,
    fallbackCount,
    lastBlockedTimestamp,
    shieldStatus,
    activeCountermeasures,
    isTesting,
    testResult,
    fetchStats,
    toggleCountermeasure,
    resetCounters,
    runDiagnostic,
  } = useCloudflareStore();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const hasInterceptions = blockedRequests > 0;

  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            hasInterceptions
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
          title="Cloudflare Bot Protection & Anti-Bot Shield Counter"
        >
          {hasInterceptions ? (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>Cloudflare Shield:</span>
          <span className="font-mono bg-[#161618] px-1.5 py-0.5 rounded text-[11px] border border-[#2A2A2E]">
            {blockedRequests} Intercepted
          </span>
          {bypassedRequests > 0 && (
            <span className="font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[11px]">
              {bypassedRequests} Bypassed
            </span>
          )}
        </button>

        {isOpen && <CloudflareModal onClose={() => setIsOpen(false)} />}
      </>
    );
  }

  return (
    <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-4 my-3 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${hasInterceptions ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-100 flex items-center gap-2">
              Cloudflare Anti-Bot Shield Counter
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold ${
                hasInterceptions ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {shieldStatus}
              </span>
            </h3>
            <p className="text-xs text-gray-400">Monitoring real-time Cloudflare 403 challenge interceptions and countermeasure bypasses</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="text-xs bg-[#242428] hover:bg-[#2F2F35] text-gray-200 px-3 py-1.5 rounded-lg border border-[#3A3A40] flex items-center gap-1.5 transition-all"
        >
          <Sliders className="w-3.5 h-3.5 text-[#E09F3E]" />
          Configure Countermeasures
        </button>
      </div>

      {/* Counter Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center mt-2">
        <div className="bg-[#111113] p-2.5 rounded-lg border border-[#2A2A2E]">
          <div className="text-lg font-mono font-bold text-amber-400">{blockedRequests}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">CF Intercepted</div>
        </div>
        <div className="bg-[#111113] p-2.5 rounded-lg border border-[#2A2A2E]">
          <div className="text-lg font-mono font-bold text-emerald-400">{bypassedRequests}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Bypassed</div>
        </div>
        <div className="bg-[#111113] p-2.5 rounded-lg border border-[#2A2A2E]">
          <div className="text-lg font-mono font-bold text-gray-300">{totalRequests}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Requests</div>
        </div>
      </div>

      {isOpen && <CloudflareModal onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const CloudflareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    totalRequests,
    blockedRequests,
    bypassedRequests,
    fallbackCount,
    lastBlockedTimestamp,
    activeCountermeasures,
    isTesting,
    testResult,
    toggleCountermeasure,
    resetCounters,
    runDiagnostic,
  } = useCloudflareStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl max-w-lg w-full p-5 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg bg-[#222226] hover:bg-[#2D2D33]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Cloudflare Anti-Bot Shield & Countermeasures</h2>
            <p className="text-xs text-gray-400">Real-time Cloudflare 403 challenge counters and proxy bypass controls</p>
          </div>
        </div>

        {/* Counter Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#111113] p-3 rounded-xl border border-[#2A2A2E] text-center">
            <div className="text-xl font-mono font-bold text-amber-400">{blockedRequests}</div>
            <div className="text-[11px] text-gray-400 font-medium">Cloudflare Blocked</div>
          </div>
          <div className="bg-[#111113] p-3 rounded-xl border border-[#2A2A2E] text-center">
            <div className="text-xl font-mono font-bold text-emerald-400">{bypassedRequests}</div>
            <div className="text-[11px] text-gray-400 font-medium">Bypassed Requests</div>
          </div>
        </div>

        {lastBlockedTimestamp && (
          <div className="bg-[#111113] border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300 flex items-center justify-between mb-4">
            <span>Last Cloudflare Challenge Intercepted:</span>
            <span className="font-mono text-gray-300">{new Date(lastBlockedTimestamp).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Countermeasure Toggles */}
        <div className="space-y-2 mb-5">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Active Countermeasures</h4>

          <label className="flex items-center justify-between bg-[#111113] p-3 rounded-xl border border-[#2A2A2E] cursor-pointer hover:border-[#3A3A40] transition-all">
            <div>
              <div className="text-xs font-semibold text-gray-200">Chrome 120 Header Spoofing</div>
              <div className="text-[11px] text-gray-400">Emulates browser Sec-CH-UA, User-Agent, and Accept headers</div>
            </div>
            <input
              type="checkbox"
              checked={activeCountermeasures.emulateChrome120}
              onChange={() => toggleCountermeasure('emulateChrome120')}
              className="accent-[#E09F3E] w-4 h-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between bg-[#111113] p-3 rounded-xl border border-[#2A2A2E] cursor-pointer hover:border-[#3A3A40] transition-all">
            <div>
              <div className="text-xs font-semibold text-gray-200">Proxy Mirror Bridge Auto-Routing</div>
              <div className="text-[11px] text-gray-400">Automatically routes requests via CORS proxy mirrors if direct request is 403</div>
            </div>
            <input
              type="checkbox"
              checked={activeCountermeasures.mirrorBridge}
              onChange={() => toggleCountermeasure('mirrorBridge')}
              className="accent-[#E09F3E] w-4 h-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between bg-[#111113] p-3 rounded-xl border border-[#2A2A2E] cursor-pointer hover:border-[#3A3A40] transition-all">
            <div>
              <div className="text-xs font-semibold text-gray-200">Automatic Offline Fallback Dataset</div>
              <div className="text-[11px] text-gray-400">Gracefully switches to local cached dataset if Cloudflare blocks all connections</div>
            </div>
            <input
              type="checkbox"
              checked={activeCountermeasures.autoFallback}
              onChange={() => toggleCountermeasure('autoFallback')}
              className="accent-[#E09F3E] w-4 h-4 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Diagnostic Test Runner */}
        <div className="bg-[#111113] border border-[#2A2A2E] rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-200">Cloudflare Connection Diagnostic</span>
            <button
              onClick={() => runDiagnostic()}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E09F3E] hover:bg-[#C88A32] text-black transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Diagnostic
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className={`mt-2 p-2.5 rounded-lg text-xs font-mono border ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1 border-b border-white/10 pb-1">
                <span>Status Code: HTTP {testResult.statusCode}</span>
                <span>{testResult.timestamp}</span>
              </div>
              <p className="text-[11px] break-words">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2E]">
          <button
            onClick={resetCounters}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#222226]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Counters
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#26262B] hover:bg-[#323238] text-gray-200 text-xs font-semibold rounded-lg border border-[#3A3A40]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
