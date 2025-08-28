// Funcionalidad del modal de galería
const modal = document.getElementById('gallery-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCounter = document.getElementById('modal-counter');
const closeModal = document.getElementById('close-modal');
const prevButton = document.getElementById('prev-image');
const nextButton = document.getElementById('next-image');

let currentImageIndex = 0;
let galleryImages = [];

// Recopilar todas las imágenes de la galería
document.addEventListener('DOMContentLoaded', () => {
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryImages = Array.from(galleryItems).map(item => ({
    src: item.dataset.src,
    alt: item.dataset.alt,
    title: item.dataset.title
  }));
});

function openModal(index) {
  currentImageIndex = index;
  updateModalContent();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeModalHandler() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
}

function updateModalContent() {
  const image = galleryImages[currentImageIndex];
  modalImage.src = image.src;
  modalImage.alt = image.alt;
  modalTitle.textContent = image.title;
  modalCounter.textContent = `${currentImageIndex + 1} de ${galleryImages.length}`;
}

function showPrevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  updateModalContent();
}

function showNextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  updateModalContent();
}

// Event listeners
closeModal.addEventListener('click', closeModalHandler);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModalHandler();
});

prevButton.addEventListener('click', showPrevImage);
nextButton.addEventListener('click', showNextImage);

// Navegación con teclado
document.addEventListener('keydown', (e) => {
  if (!modal.classList.contains('hidden')) {
    switch(e.key) {
      case 'Escape':
        closeModalHandler();
        break;
      case 'ArrowLeft':
        showPrevImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
    }
  }
});

// Hacer la función openModal global
window.openModal = openModal;