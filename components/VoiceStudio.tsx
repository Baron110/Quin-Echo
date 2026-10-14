'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '@/lib/audio/engine';
import { getPreset } from '@/lib/audio/presets';
import type { PresetName, AudioSettings } from '@/types/audio';
import Visualizer from './Visualizer';
import PresetGrid from './PresetGrid';
import AudioSliders from './AudioSliders';

type RoutableAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };

export default function VoiceStudio() {
  const engine = useRef<AudioEngine | null>(null);
  const playback = useRef<RoutableAudio | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingUrl = useRef('');
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<PresetName>('normal');
  const [settings, setSettings] = useState<AudioSettings>(getPreset('normal'));
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState('');
  const [canRoute, setCanRoute] = useState(false);

  useEffect(() => {
    engine.current = new AudioEngine();
    playback.current = new Audio() as RoutableAudio;
    setCanRoute(typeof playback.current.setSinkId === 'function');
    const refresh = () => navigator.mediaDevices?.enumerateDevices().then(setDevices).catch(() => {});
    refresh();
    navigator.mediaDevices?.addEventListener('devicechange', refresh);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refresh);
      if (recorder.current?.state === 'recording') {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      playback.current?.pause();
      if (playback.current) playback.current.srcObject = null;
      engine.current?.stop();
      if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
    };
  }, []);

  async function toggleMic() {
    if (busy) return;
    setError('');
    if (active) {
      if (recorder.current?.state === 'recording') recorder.current.stop();
      playback.current?.pause();
      if (playback.current) playback.current.srcObject = null;
      engine.current?.stop();
      setActive(false); setListening(false); setAnalyser(null); setOutput('');
      return;
    }
    setBusy(true);
    try {
      const stream = await engine.current!.start(input || undefined);
      engine.current!.applyPreset(getPreset(preset));
      engine.current!.updateSettings(settings);
      playback.current!.srcObject = stream;
      setAnalyser(engine.current!.getAnalyser());
      setActive(true);
      setDevices(await navigator.mediaDevices.enumerateDevices());
    } catch (err) {
      engine.current?.stop();
      setActive(false); setAnalyser(null);
      setError(err instanceof Error ? err.message : 'Unable to start microphone.');
    } finally { setBusy(false); }
  }

  async function route(id: string) {
    setError(''); setBusy(true);
    const audio = playback.current!;
    audio.pause(); setListening(false); setOutput('');
    try {
      if (id) {
        if (!audio.setSinkId) throw new Error('Output selection is unavailable in this browser.');
        await audio.setSinkId(id);
        await audio.play();
        setOutput(id);
      }
    } catch (err) {
      audio.pause();
      setError(err instanceof Error ? err.message : 'Could not route audio.');
    } finally { setBusy(false); }
  }

  async function monitor() {
    if (listening) { playback.current?.pause(); setListening(false); return; }
    setBusy(true); setError('');
    try {
      await playback.current?.setSinkId?.('');
      await playback.current!.play();
      setListening(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Playback failed.'); }
    finally { setBusy(false); }
  }

  function record() {
    setError('');
    if (recording) { recorder.current?.stop(); return; }
    try {
      if (typeof MediaRecorder === 'undefined') throw new Error('Recording is unavailable in this browser.');
      const next = new MediaRecorder(engine.current!.getOutputStream()!);
      const chunks: Blob[] = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
        const url = URL.createObjectURL(new Blob(chunks, { type: next.mimeType }));
        recordingUrl.current = url; setClip(url); setRecording(false);
      };
      next.onerror = () => { setError('Recording failed. Try again.'); setRecording(false); };
      next.start(); recorder.current = next; setRecording(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Recording failed.'); }
  }

  function change(key: keyof AudioSettings, value: number) {
    setSettings((previous) => ({ ...previous, [key]: value }));
    if (active) engine.current?.updateSettings({ [key]: value });
  }

  const selectClass = 'w-full rounded-lg border border-gray-300 bg-white p-3 text-sm';
  const buttonClass = 'rounded-full border border-black px-4 py-2 text-sm font-semibold disabled:opacity-40';
  return (
    <div className="space-y-6">
      <div className="flex justify-between text-xs uppercase tracking-widest"><span>Live signal</span><span role="status">{busy ? 'Connecting...' : active ? 'Processing' : 'Mic off'}</span></div>
      <Visualizer analyser={analyser} active={active} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="mic-input">1. Choose your microphone</label>
        <select id="mic-input" className={selectClass} value={input} disabled={active || busy} onChange={(event) => setInput(event.target.value)}>
          <option value="">Default microphone</option>
          {devices.filter((device) => device.kind === 'audioinput' && device.deviceId).map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}
        </select>
        <button className={`${buttonClass} bg-black text-white`} disabled={busy} onClick={toggleMic}>{busy ? 'Connecting...' : active ? 'Stop microphone' : 'Start microphone'}</button>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold">2. Shape your voice</p>
        <PresetGrid active={preset} onChange={(name) => { setPreset(name); setSettings(getPreset(name)); if (active) engine.current?.applyPreset(getPreset(name)); }} />
        <AudioSliders pitch={settings.pitch} reverb={settings.reverb} distortion={settings.distortion} volume={settings.volume} onPitch={(value) => change('pitch', value)} onReverb={(value) => change('reverb', value)} onDistortion={(value) => change('distortion', value)} onVolume={(value) => change('volume', value)} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-semibold">3. Test your voice</p>
        <p className="text-xs text-gray-600">Use headphones for live monitoring. Record a short clip to check the effect without speaker feedback.</p>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={!active || busy || !!output} onClick={monitor}>{listening ? 'Stop listening' : 'Listen on headphones'}</button>
          <button className={buttonClass} disabled={!active || busy} onClick={record}>{recording ? 'Finish recording' : 'Record test clip'}</button>
        </div>
        {recording && <p role="status" className="text-sm">Recording processed audio...</p>}
        {clip && <div className="space-y-2"><audio controls src={clip} className="w-full" /><a href={clip} download="quin-echo-test" className="text-sm underline">Download recording</a></div>}
      </div>
      <div className="space-y-3">
        <label htmlFor="audio-output" className="block text-sm font-semibold">4. Send to your call app</label>
        <select id="audio-output" className={selectClass} value={output} disabled={!active || busy || !canRoute} onChange={(event) => route(event.target.value)}>
          <option value="">Output off — select virtual cable</option>
          {devices.filter((device) => device.kind === 'audiooutput' && device.deviceId && !['default', 'communications'].includes(device.deviceId)).map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Output ${index + 1}`}</option>)}
        </select>
        <p className="text-xs text-gray-600">{canRoute ? 'Choose CABLE Input here, then CABLE Output as the microphone in Discord, Zoom or your call app. On Mac, choose BlackHole in both. Keep this tab open.' : 'This browser cannot select an output device. Try a desktop browser with output selection support; recording and monitoring are still available.'}</p>
        {output && <p role="status" className="text-sm font-medium">Sending processed audio to the selected output. Test it in your call app before joining a call.</p>}
      </div>
    </div>
  );
}
