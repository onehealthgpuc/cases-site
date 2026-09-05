const imgModal = document.getElementById('imgModal');
const imgModalContent = document.getElementById('imgModalContent');
const drawCanvas = document.getElementById('drawCanvas');
const zoomWrapper = document.getElementById('zoomWrapper');
const viewerStage = document.getElementById('viewerStage');
const viewerStatus = document.getElementById('viewerStatus');
const previousPage = document.getElementById('previousPage');
const nextPage = document.getElementById('nextPage');
const drawingModeBtn = document.getElementById('drawingModeBtn');
const contrastSlider = document.getElementById('contrastSlider');
const contrastValue = document.getElementById('contrastValue');
let imageList = [], currentImageIndex = 0, zoomLevel = 1;
let pdfDocument = null, pdfLoadingTask = null, pdfPage = 1;
let viewerSession = 0, busy = false, ctx, drawing = false, returnFocus;
let drawingMode = false, contrastLevel = 100;
let pdfLibrary;
const pdfBase = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/';

function loadPdfLibrary() {
  if (!pdfLibrary) pdfLibrary = import(`${pdfBase}build/pdf.mjs`).then(lib => {
    lib.GlobalWorkerOptions.workerSrc = `${pdfBase}build/pdf.worker.mjs`;
    return lib;
  }).catch(error => { pdfLibrary = null; throw error; });
  return pdfLibrary;
}

function updateNavigation() {
  const count = pdfDocument ? pdfDocument.numPages : imageList.length;
  const current = pdfDocument ? pdfPage : currentImageIndex + 1;
  previousPage.disabled = busy || current <= 1;
  nextPage.disabled = busy || current >= count;
  if (!busy) viewerStatus.textContent = `${pdfDocument ? 'Page' : 'Image'} ${current} of ${count}`;
}

function startViewer() {
  viewerSession++;
  pdfLoadingTask?.destroy().catch(()=>{});
  pdfLoadingTask = null;
  pdfDocument = null;
  busy = true;
  drawing = false;
  setDrawingMode(false);
  updateContrast(100);
  zoomLevel = 1;
  imgModalContent.removeAttribute('src');
  zoomWrapper.hidden = true;
  document.getElementById('viewerOriginal').hidden = true;
  if (imgModal.style.display === 'none') returnFocus = document.activeElement;
  imgModal.style.display = 'flex';
  document.body.classList.add('viewer-open');
  document.querySelector('#buttonsOverlay button[aria-label="Close viewer"]').focus();
  viewerStatus.textContent = 'Loading…';
  updateNavigation();
  return viewerSession;
}

function displayImage(src, alt, session) {
  return new Promise((resolve, reject) => {
    imgModalContent.onload = () => {
      if (session !== viewerSession) return resolve();
      zoomWrapper.hidden = false;
      zoomLevel = 1;
      applyZoom();
      viewerStage.scrollTo(0, 0);
      resolve();
    };
    imgModalContent.onerror = () => reject(new Error('Unable to load image'));
    imgModalContent.alt = alt;
    imgModalContent.src = src;
  });
}

async function openPdfViewer(url, name = 'PDF') {
  const session = startViewer();
  imageList = [];
  const original = document.getElementById('viewerOriginal');
  original.href = url;
  original.hidden = false;
  try {
    const lib = await loadPdfLibrary();
    if (session !== viewerSession) return;
    pdfLoadingTask = lib.getDocument({url, cMapUrl:`${pdfBase}cmaps/`, cMapPacked:true,
      standardFontDataUrl:`${pdfBase}standard_fonts/`, wasmUrl:`${pdfBase}wasm/`});
    const document = await pdfLoadingTask.promise;
    if (session !== viewerSession) return;
    pdfDocument = document;
    pdfPage = 1;
    await renderPdfPage(session, name);
  } catch (error) {
    if (session !== viewerSession) return;
    console.error('PDF viewer:', error);
    viewerStatus.textContent = 'Unable to display this PDF. Use Open original PDF.';
    previousPage.disabled = nextPage.disabled = true;
  }
}

async function renderPdfPage(session = viewerSession, name = 'PDF') {
  busy = true;
  zoomWrapper.hidden = true;
  updateNavigation();
  viewerStatus.textContent = `Loading page ${pdfPage}…`;
  try {
    const page = await pdfDocument.getPage(pdfPage);
    if (session !== viewerSession) return;
    const base = page.getViewport({scale:1});
    const scale = Math.min(2.5, Math.sqrt(6000000 / (base.width * base.height)));
    const viewport = page.getViewport({scale});
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d'), viewport}).promise;
    if (session !== viewerSession) return;
    await displayImage(canvas.toDataURL(), `${name}, page ${pdfPage}`, session);
    if (session !== viewerSession) return;
    busy = false;
    updateNavigation();
  } catch (error) {
    if (session !== viewerSession) return;
    busy = false;
    updateNavigation();
    viewerStatus.textContent = `Unable to display page ${pdfPage}. Try another page or open the original PDF.`;
    console.error(error);
  }
}

async function openImageViewer(image) {
  if (image.dataset.pdfUrl) return openPdfViewer(image.dataset.pdfUrl, image.alt);
  const session = startViewer();
  imageList = Array.from(document.querySelectorAll('#filesContainer img, #caseInfo img'));
  currentImageIndex = imageList.indexOf(image);
  try {
    await displayImage(image.src, image.alt || 'Case image', session);
    if (session !== viewerSession) return;
    busy = false;
    updateNavigation();
  } catch {
    if (session === viewerSession) viewerStatus.textContent = 'Unable to load this image.';
  }
}

document.addEventListener('click', event => {
  if (event.target.matches('#filesContainer img, #caseInfo img')) openImageViewer(event.target);
});
function showNextImage() { changeViewerPage(1); }
function showPrevImage() { changeViewerPage(-1); }
function changeViewerPage(direction) {
  if (busy) return;
  if (pdfDocument) {
    const next = pdfPage + direction;
    if (next < 1 || next > pdfDocument.numPages) return;
    pdfPage = next;
    renderPdfPage();
  } else {
    const next = currentImageIndex + direction;
    if (next >= 0 && next < imageList.length) openImageViewer(imageList[next]);
  }
}

function applyZoom() {
  if (!imgModalContent.naturalWidth || zoomWrapper.hidden) return;
  const fit = Math.min((viewerStage.clientWidth - 32) / imgModalContent.naturalWidth,
    (viewerStage.clientHeight - 32) / imgModalContent.naturalHeight, 1);
  const width = Math.max(1, Math.round(imgModalContent.naturalWidth * fit * zoomLevel));
  const height = Math.max(1, Math.round(imgModalContent.naturalHeight * fit * zoomLevel));
  zoomWrapper.style.width = `${width}px`;
  zoomWrapper.style.height = `${height}px`;
  viewerStage.classList.toggle('is-scrollable', width > viewerStage.clientWidth - 32 || height > viewerStage.clientHeight - 32);
  drawCanvas.width = width;
  drawCanvas.height = height;
  ctx = drawCanvas.getContext('2d');
  ctx.strokeStyle = 'yellow'; ctx.lineWidth = 3; ctx.lineCap = 'round';
}
function zoomIn() { zoomLevel = Math.min(zoomLevel + 0.25, 4); applyZoom(); }
function zoomOut() { zoomLevel = Math.max(zoomLevel - 0.25, 0.5); applyZoom(); }
function resetZoom() { zoomLevel = 1; applyZoom(); viewerStage.scrollTo(0,0); }
function clearDrawing() { ctx?.clearRect(0,0,drawCanvas.width,drawCanvas.height); }
function setDrawingMode(enabled) {
  drawingMode = Boolean(enabled);
  drawing = false;
  imgModal.classList.toggle('drawing-mode', drawingMode);
  drawingModeBtn?.setAttribute('aria-pressed', String(drawingMode));
  if (drawingModeBtn) drawingModeBtn.textContent = drawingMode ? 'Drawing on' : 'Draw';
}
function toggleDrawingMode() { setDrawingMode(!drawingMode); }
function updateContrast(value) {
  contrastLevel = Math.max(50, Math.min(250, Number(value) || 100));
  imgModalContent.style.filter = `contrast(${contrastLevel}%)`;
  if (contrastSlider) contrastSlider.value = String(contrastLevel);
  if (contrastValue) contrastValue.textContent = `${contrastLevel}%`;
}
function closeViewer() {
  viewerSession++;
  pdfLoadingTask?.destroy().catch(()=>{});
  pdfLoadingTask = pdfDocument = null;
  imgModal.style.display = 'none';
  document.body.classList.remove('viewer-open');
  imgModalContent.onload = imgModalContent.onerror = null;
  imgModalContent.removeAttribute('src');
  drawing = false;
  setDrawingMode(false);
  viewerStage.classList.remove('is-scrollable');
  returnFocus?.focus();
}
viewerStage.addEventListener('click', event => { if (event.target === viewerStage) closeViewer(); });
document.addEventListener('keydown', event => {
  if (imgModal.style.display === 'none') return;
  if (['Escape','ArrowRight','ArrowLeft'].includes(event.key)) event.preventDefault();
  if (event.key === 'Escape') { event.stopPropagation(); closeViewer(); }
  else if (event.key === 'ArrowRight') showNextImage();
  else if (event.key === 'ArrowLeft') showPrevImage();
  else if (event.key === 'Tab') {
    const controls = Array.from(imgModal.querySelectorAll('button:not(:disabled), a:not([hidden])'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
drawCanvas.addEventListener('pointerdown', event => {
  if (!ctx || busy || !drawingMode) return;
  drawing = true; drawCanvas.setPointerCapture(event.pointerId);
  ctx.beginPath(); ctx.moveTo(event.offsetX,event.offsetY);
});
drawCanvas.addEventListener('pointermove', event => {
  if (!drawing) return;
  ctx.lineTo(event.offsetX,event.offsetY); ctx.stroke();
});
drawCanvas.addEventListener('pointerup', () => drawing = false);
drawCanvas.addEventListener('pointercancel', () => drawing = false);
window.addEventListener('resize', applyZoom);
