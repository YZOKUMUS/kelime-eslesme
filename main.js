// Fetch the JSON data dynamically
let data = await fetch('./data.json')
  .then(response => response.json())
  .then(data => {
    console.log("Data:", data);
  })
  .catch(error => {
    console.error("Error loading JSON:", error);
  });

let kelimeListesi = [];
let currentGroupIndex = 0;
const groupSize = 8;
let score = 0;

const oyunAlani = document.getElementById('oyun-alani');
const prevButton = document.getElementById('onceki-grup');
const nextButton = document.getElementById('sonraki-grup');
const scoreDisplay = document.getElementById('score');

// Excel dosyasını yükle
document.getElementById('excel-file').addEventListener('change', loadExcel);

prevButton.addEventListener('click', () => {
  currentGroupIndex--;
  renderGroup();
});

nextButton.addEventListener('click', () => {
  currentGroupIndex++;
  renderGroup();
});

// Excel dosyasını okuma işlemi
function loadExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    kelimeListesi = jsonData.slice(1).map(([arabic, turkish, soundUrl]) => ({ arabic, turkish, soundUrl }));
    renderGroup();
  };
  reader.readAsArrayBuffer(file);
}

// Kartları gruplar halinde render et
function renderGroup() {
  oyunAlani.innerHTML = '';
  const start = currentGroupIndex * groupSize;
  const group = kelimeListesi.slice(start, start + groupSize);

  if (!group.length) return;

  const kelimeGrubu = document.createElement('div');
  kelimeGrubu.classList.add('kelime-grubu');

  const arabicSutun = createColumn(group, 'arabic', true);
  const turkishSutun = createColumn(shuffleArray(group), 'turkish', false);

  kelimeGrubu.append(arabicSutun, turkishSutun);
  oyunAlani.appendChild(kelimeGrubu);

  prevButton.disabled = currentGroupIndex === 0;
  nextButton.disabled = start + groupSize >= kelimeListesi.length;
}

// Kolon oluşturma
function createColumn(data, key, isDraggable) {
  const sutun = document.createElement('div');
  sutun.classList.add('sutun');

  data.forEach((item) => {
    const element = document.createElement('div');
    element.classList.add(isDraggable ? 'kart' : 'hedef-alan');
    element.textContent = item[key];
    element.dataset.arabic = item.arabic;

    if (isDraggable) addDragEvents(element);
    else addDropEvents(element);

    sutun.appendChild(element);
  });

  return sutun;
}

// Sürükleme olayları
function addDragEvents(element) {
  element.setAttribute('draggable', 'true');
  element.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', element.dataset.arabic);
    element.classList.add('surukleniyor');
  });
  element.addEventListener('dragend', () => element.classList.remove('surukleniyor'));
}

// Bırakma olayları
function addDropEvents(element) {
  element.addEventListener('dragover', (e) => e.preventDefault());
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedArabic = e.dataTransfer.getData('text/plain');
    const targetArabic = element.dataset.arabic;

    if (draggedArabic === targetArabic) {
      element.classList.add('dogru');
      const correctCard = document.querySelector(`[data-arabic="${draggedArabic}"]`);
      correctCard.classList.add('dogru');

      score += 10;
      scoreDisplay.textContent = score;

      element.setAttribute('draggable', 'false');
      correctCard.setAttribute('draggable', 'false');

      playArabicAudio(draggedArabic);
    } else {
      element.classList.add('yanlis');
      setTimeout(() => element.classList.remove('yanlis'), 500);

      score -= 5;
      scoreDisplay.textContent = score;
    }
  });
}

// Arapça kelimenin sesini çalma (sound_url kullanılarak)
function playArabicAudio(word) {
  // Kelimeyi kelimeListesi'nde bul
  const kelime = kelimeListesi.find(item => item.arabic === word);
  if (kelime && kelime.soundUrl) {
    const audio = new Audio(kelime.soundUrl);
    audio.play();
  } else {
    // Eğer ses dosyası yoksa, metin okuma
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'ar-SA';
    speechSynthesis.speak(utterance);
  }
}

// Diziyi karıştırma
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}
