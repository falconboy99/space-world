// Records the WebGL canvas to a downloadable .webm video
// using canvas.captureStream + MediaRecorder.
export function createRecorder(canvas) {
  let recorder = null;
  let chunks = [];

  function pickMimeType() {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
  }

  function start() {
    if (recorder) return false;
    const stream = canvas.captureStream(60);
    recorder = new MediaRecorder(stream, {
      mimeType: pickMimeType(),
      videoBitsPerSecond: 14_000_000,
    });
    chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start(250);
    return true;
  }

  function stop(filename) {
    return new Promise((resolve) => {
      if (!recorder) return resolve(null);
      const rec = recorder;
      recorder = null;
      rec.onstop = () => {
        const ext = rec.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: rec.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve(a.download);
      };
      rec.stop();
    });
  }

  return {
    start,
    stop,
    get recording() {
      return !!recorder;
    },
  };
}
