// Validación adicional del formulario de registro de jugadores
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');
  const inputs = form.querySelectorAll('input[required]');
  
  // Validación en tiempo real
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.style.borderColor = '#ef4444';
      } else {
        this.style.borderColor = '#2DB4A5';
      }
    });
    
    input.addEventListener('input', function() {
      if (this.style.borderColor === 'rgb(239, 68, 68)') {
        this.style.borderColor = '#d1d5db';
      }
    });
  });
  
  // Validación del teléfono
  const telefonoInput = document.getElementById('telefono');
  telefonoInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
  });
  
  // Manejo del envío del formulario
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar todos los campos
    let isValid = true;
    inputs.forEach(input => {
      if (input.value.trim() === '') {
        input.style.borderColor = '#ef4444';
        isValid = false;
      }
    });
    
    if (isValid) {
      // Aquí puedes agregar la lógica para enviar los datos
      alert('¡Registro exitoso! Bienvenido a los juegos.');
      //redirige a los juegos
      window.location.href = '/juegos';
      // form.submit(); // Descomenta esta línea cuando tengas el endpoint listo
    } else {
      alert('Por favor, completa todos los campos requeridos.');
    }
  });
});