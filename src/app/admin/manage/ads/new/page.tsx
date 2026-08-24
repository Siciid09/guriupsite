"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { Copy, Check, ExternalLink, AlertCircle, Megaphone, Link as LinkIcon, Target, Smartphone, Sparkles } from "lucide-react";

export default function NewAdPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    campaign_id: "",
    destination_url: "",
    platform: "all",
    facebook_ad_id: "",
  });

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      const { data, error } = await supabase.from("campaigns").select("id, name");
      
      if (error) {
        console.error("Failed to load campaigns:", error);
        setErrorMsg("Could not load campaigns. Check your database connection.");
        return;
      }

      if (data && data.length > 0) {
        setCampaigns(data);
        setFormData((prev) => ({ ...prev, campaign_id: data[0].id }));
      }
    }
    loadCampaigns();
  }, []);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedLink(null);

    if (!formData.campaign_id) {
      setErrorMsg("No campaign selected. Please ensure a campaign exists in the database.");
      setLoading(false);
      return;
    }

    try {
      const trackingCode = generateRandomCode();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://go.mydomain.com";

      const { data, error } = await supabase
        .from("ads")
        .insert({
          name: formData.name,
          campaign_id: formData.campaign_id,
          destination_url: formData.destination_url,
          platform: formData.platform,
          facebook_ad_id: formData.facebook_ad_id || null,
          tracking_code: trackingCode,
        })
        .select()
        .single();

      if (error) throw error; 

      const trackingUrl = `${origin}/a/${trackingCode}`;
      
      setGeneratedCode(trackingCode);
      setGeneratedLink(trackingUrl);
      setSuccessMsg(`Successfully created tracking link for "${formData.name}"!`);
      
    } catch (err: any) {
      console.error("FULL TERMINAL ERROR:", err);
      setErrorMsg(err.message || JSON.stringify(err) || "An unknown error occurred while creating the link.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shared modern input styles (Forces text-slate-900 so text is NEVER invisible)
  const inputStyles = "w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
          <LinkIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create Tracking Link</h2>
          <p className="text-slate-500 mt-1">Generate a unique attribution URL for your Facebook Ad campaign.</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-red-900 font-semibold text-sm">Failed to create link</h3>
            <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 md:p-8 space-y-8">
        
        {/* Section 1: Basic Info */}
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Identifier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Ad Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Summer Promo - Video 1"
                className={inputStyles}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Campaign</label>
              <select
                className={inputStyles}
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
              >
                <option value="" disabled>Select a campaign...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-slate-100" />

        {/* Section 2: Routing */}
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" /> Routing
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Destination URL</label>
            <input
              type="url"
              required
              placeholder="https://play.google.com/store/apps/details?id=com.example.app"
              className={inputStyles}
              value={formData.destination_url}
              onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Platform</label>
              <select
                className={inputStyles}
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="all">Universal / All Platforms</option>
                <option value="android">Android (Google Play)</option>
                <option value="ios">iOS (App Store)</option>
                <option value="web">Web Landing Page</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                Facebook Ad ID <span className="text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 238519283719"
                className={inputStyles}
                value={formData.facebook_ad_id}
                onChange={(e) => setFormData({ ...formData, facebook_ad_id: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden group bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-md shadow-slate-900/10"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                "Generating Engine Link..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Tracking Link
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {/* SUCCESS RESULT UI */}
      {successMsg && generatedLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 shadow-lg shadow-emerald-100/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-emerald-900 font-bold text-xl">Link Generated Successfully!</h3>
            <p className="text-emerald-700 text-sm max-w-md">{successMsg}</p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center gap-3 bg-white p-2 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="pl-4 py-2 font-mono text-emerald-800 font-bold text-sm">
              {generatedCode}
            </div>
            <div className="w-px h-8 bg-emerald-100 hidden md:block" />
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="flex-1 w-full text-sm bg-transparent outline-none font-mono text-slate-600 px-4 py-2"
            />
            <div className="flex gap-2 w-full md:w-auto">
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-none flex justify-center items-center p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={copyToClipboard}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}