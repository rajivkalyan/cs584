/**
 * Medical History Intake App - Rural Bangladesh
 * Features: Login, Dashboard, Patient Registration, Voice Capture (Web Audio API),
 * Speech-to-Text (Web Speech API + Bangla integration point), AI Summary, Data Export
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentScreen: 'screen-login',
    physician: null,
    patients: [],
    recentRecords: [],
    currentPatient: null,
    currentTranscript: '',
    currentAudioBlob: null,
    currentSummary: null,
  };

  // --- DOM refs (lazy) ---
  function $(id) {
    return document.getElementById(id);
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    const screen = $(screenId);
    if (screen) screen.classList.add('active');
    state.currentScreen = screenId;
  }

  // --- Login ---
  $('login-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = $('login-username').value.trim();
    const password = $('login-password').value;
    if (!username || !password) return;
    state.physician = { username, loggedAt: new Date().toISOString() };
    showScreen('screen-dashboard');
    renderRecentRecords();
  });

  $('btn-logout')?.addEventListener('click', function () {
    state.physician = null;
    showScreen('screen-login');
    $('login-form').reset();
  });

  // --- Dashboard ---
  $('btn-new-intake')?.addEventListener('click', function () {
    state.currentPatient = state.patients[state.patients.length - 1] || null;
    state.currentTranscript = '';
    state.currentAudioBlob = null;
    state.currentSummary = null;
    const nameEl = $('voice-patient-name');
    if (nameEl) nameEl.textContent = state.currentPatient ? `রোগী: ${state.currentPatient.name} / Patient: ${state.currentPatient.name}` : 'নতুন সাক্ষাত্কার / New intake';
    $('transcript-text').textContent = '';
    $('transcript-area').classList.add('hidden');
    $('btn-done-voice').classList.add('hidden');
    $('record-status').textContent = '';
    showScreen('screen-voice');
  });

  $('btn-register-patient')?.addEventListener('click', function () {
    showScreen('screen-register');
  });

  $('btn-back-register')?.addEventListener('click', function () {
    showScreen('screen-dashboard');
  });

  // --- Patient Registration ---
  $('register-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const patient = {
      id: 'P' + Date.now(),
      name: $('reg-name').value.trim(),
      age: parseInt($('reg-age').value, 10) || 0,
      gender: $('reg-gender').value || 'unknown',
      village: $('reg-village').value.trim(),
      phone: $('reg-phone').value.trim(),
      registeredAt: new Date().toISOString(),
    };
    state.patients.push(patient);
    $('register-form').reset();
    showScreen('screen-dashboard');
    renderRecentRecords();
  });

  // --- Voice Capture: Web Audio API recording + waveform ---
  let mediaStream = null;
  let audioContext = null;
  let mediaRecorder = null;
  let analyser = null;
  let animationId = null;
  let recordedChunks = [];

  const waveformCanvas = $('waveform');
  const waveformCtx = waveformCanvas?.getContext('2d');

  function drawWaveform() {
    if (!waveformCtx || !analyser) return;
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function frame() {
      animationId = requestAnimationFrame(frame);
      analyser.getByteTimeDomainData(dataArray);
      waveformCtx.fillStyle = 'rgba(13, 71, 161, 0.3)';
      waveformCtx.fillRect(0, 0, width, height);
      waveformCtx.lineWidth = 2;
      waveformCtx.strokeStyle = '#ffffff';
      waveformCtx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2 + height / 2;
        if (i === 0) waveformCtx.moveTo(x, y);
        else waveformCtx.lineTo(x, y);
        x += sliceWidth;
      }
      waveformCtx.lineTo(width, height / 2);
      waveformCtx.stroke();
    }
    frame();
  }

  function stopWaveform() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (waveformCtx && waveformCanvas) {
      waveformCtx.fillStyle = 'rgba(13, 71, 161, 0.3)';
      waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    }
  }

  async function startRecording() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const streamForRecorder = audioContext.createMediaStreamDestination();
      source.connect(streamForRecorder);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder = new MediaRecorder(streamForRecorder.stream, { mimeType });
      recordedChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (recordedChunks.length > 0) {
          state.currentAudioBlob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
        }
      };
      mediaRecorder.start(200);
      drawWaveform();
      $('btn-record').classList.add('recording');
      $('record-label').textContent = 'বন্ধ করুন / Stop';
      $('record-status').textContent = 'রেকর্ডিং... / Recording...';
      startSpeechRecognition();
    } catch (err) {
      $('record-status').textContent = 'মাইক্রোফোন অনুমতি প্রয়োজন / Microphone permission needed';
      console.error(err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    stopWaveform();
    analyser = null;
    $('btn-record').classList.remove('recording');
    $('record-label').textContent = 'রেকর্ড শুরু করুন / Start Recording';
    $('record-status').textContent = 'রেকর্ড সম্পন্ন / Recording complete';
    stopSpeechRecognition();
    $('transcript-area').classList.remove('hidden');
    $('btn-done-voice').classList.remove('hidden');
  }

  // --- Speech-to-Text: Web Speech API (English) + Bangla integration point ---
  let speechRecognition = null;

  function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      $('record-status').textContent = 'ব্রাউজার স্পিচ সাপোর্ট করে না / Speech not supported';
      return;
    }
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    // Use Bangla if supported (Chrome: bn-BD); else fallback to en
    const lang = 'bn-BD';
    try {
      speechRecognition.lang = lang;
    } catch (_) {
      speechRecognition.lang = 'en-US';
    }
    speechRecognition.onresult = function (event) {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        state.currentTranscript += transcript + ' ';
        $('transcript-text').textContent = state.currentTranscript.trim();
      }
    };
    speechRecognition.onerror = function (e) {
      if (e.error !== 'no-speech') console.warn('Speech recognition error:', e.error);
    };
    speechRecognition.start();
  }

  function stopSpeechRecognition() {
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (_) {}
      speechRecognition = null;
    }
  }

  $('btn-record')?.addEventListener('click', function () {
    if ($('btn-record').classList.contains('recording')) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  $('btn-back-voice')?.addEventListener('click', function () {
    if ($('btn-record').classList.contains('recording')) stopRecording();
    showScreen('screen-dashboard');
  });

  $('btn-done-voice')?.addEventListener('click', function () {
    const transcript = ($('transcript-text').textContent || state.currentTranscript || '').trim();
    state.currentSummary = generateAISummary(transcript);
    const record = {
      id: 'R' + Date.now(),
      patientId: state.currentPatient?.id,
      patientName: state.currentPatient?.name || 'Unknown',
      date: new Date().toISOString(),
      transcript,
      summary: state.currentSummary,
      physician: state.physician?.username,
    };
    state.recentRecords.unshift(record);
    renderRecentRecords();
    renderSummary();
    showScreen('screen-summary');
  });

  // --- AI Summary (simulated from transcript) ---
  function generateAISummary(transcript) {
    if (!transcript) {
      return {
        chiefComplaint: 'কোনো অভিযোগ লিপিবদ্ধ নেই / No complaint recorded',
        symptoms: [],
        duration: '—',
        severity: 'mild',
        notes: 'ভয়েস রেকর্ড বা ট্রান্সক্রিপ্ট নেই। / No voice or transcript.',
      };
    }
    const lower = transcript.toLowerCase();
    const symptoms = [];
    if (/\b(জ্বর|fever|fever)\b/i.test(transcript)) symptoms.push({ name: 'জ্বর / Fever', severity: 'moderate' });
    if (/\b(ব্যথা|pain|headache|মাথাব্যথা)\b/i.test(transcript)) symptoms.push({ name: 'ব্যথা / Pain', severity: 'moderate' });
    if (/\b(কাশি|cough)\b/i.test(transcript)) symptoms.push({ name: 'কাশি / Cough', severity: 'mild' });
    if (/\b(পেট|stomach|পেটে ব্যথা)\b/i.test(transcript)) symptoms.push({ name: 'পেটের সমস্যা / Stomach', severity: 'mild' });
    if (symptoms.length === 0) symptoms.push({ name: 'রোগীর বর্ণনা অনুযায়ী / Per patient description', severity: 'mild' });
    return {
      chiefComplaint: transcript.slice(0, 120) + (transcript.length > 120 ? '…' : ''),
      symptoms,
      duration: 'রোগী কর্তৃক বর্ণিত / As stated by patient',
      severity: symptoms.some((s) => s.severity === 'severe') ? 'severe' : symptoms.some((s) => s.severity === 'moderate') ? 'moderate' : 'mild',
      notes: transcript,
    };
  }

  function renderSummary() {
    const summary = state.currentSummary;
    const patient = state.currentPatient;
    const container = $('summary-content');
    if (!container) return;
    let html = '';
    if (patient) {
      html += `<div class="summary-section"><h3>রোগীর তথ্য / Patient Info</h3><p>${patient.name}, ${patient.age} বছর, ${patient.village || '—'}</p></div>`;
    }
    if (summary) {
      html += `<div class="summary-section"><h3>প্রধান অভিযোগ / Chief Complaint</h3><p>${escapeHtml(summary.chiefComplaint)}</p></div>`;
      html += `<div class="summary-section"><h3>লক্ষণ / Symptoms</h3><ul>`;
      (summary.symptoms || []).forEach((s) => {
        html += `<li class="severity-${s.severity}">${escapeHtml(s.name)}</li>`;
      });
      html += `</ul></div>`;
      html += `<div class="summary-section"><h3>সময়কাল / Duration</h3><p>${escapeHtml(summary.duration)}</p></div>`;
      html += `<div class="summary-section"><h3>নোট / Notes</h3><p>${escapeHtml(summary.notes)}</p></div>`;
    }
    container.innerHTML = html || '<p>কোনো সারাংশ নেই।</p>';
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- Recent records list ---
  function renderRecentRecords() {
    const list = $('recent-list');
    if (!list) return;
    const records = state.recentRecords.slice(0, 10);
    list.innerHTML = records
      .map(
        (r) =>
          `<li data-id="${r.id}">
            <span>${escapeHtml(r.patientName)} — ${formatDate(r.date)}</span>
            <span class="date">${r.id}</span>
          </li>`
      )
      .join('');
    list.querySelectorAll('li').forEach((li) => {
      li.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const rec = state.recentRecords.find((r) => r.id === id);
        if (rec) {
          state.currentSummary = rec.summary;
          state.currentPatient = state.patients.find((p) => p.id === rec.patientId) || { name: rec.patientName };
          renderSummary();
          showScreen('screen-summary');
        }
      });
    });
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) {
      return iso.slice(0, 10);
    }
  }

  // --- Data Export ---
  function exportJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      physician: state.physician,
      patients: state.patients,
      records: state.recentRecords,
      currentSummary: state.currentSummary,
      currentPatient: state.currentPatient,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `medical-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPDF() {
    const summary = state.currentSummary;
    const patient = state.currentPatient;
    const content = $('summary-content');
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ ব্লক করা আছে। JSON ডাউনলোড ব্যবহার করুন। / Popup blocked. Use JSON download.');
      return;
    }
    const title = 'Medical History Summary | মেডিকেল হিস্টরি সারাংশ';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #0d47a1; }
        h1 { font-size: 1.2rem; border-bottom: 2px solid #0d47a1; }
        .section { margin-bottom: 1rem; }
        ul { padding-left: 1.2rem; }
      </style></head><body>
      <h1>${title}</h1>
      <p>Export date: ${new Date().toLocaleString('en-GB')}</p>
      ${patient ? `<div class="section"><h2>Patient / রোগী</h2><p>${patient.name}, Age ${patient.age}, ${patient.village || '—'}</p></div>` : ''}
      <div class="section">${content.innerHTML}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  }

  $('btn-export-json')?.addEventListener('click', exportJSON);
  $('btn-export-pdf')?.addEventListener('click', exportPDF);

  $('btn-back-summary')?.addEventListener('click', function () {
    showScreen('screen-dashboard');
  });

  // --- Init ---
  renderRecentRecords();
})();
