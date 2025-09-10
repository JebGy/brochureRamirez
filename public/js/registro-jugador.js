// Configuración para el registro de jugadores
import { supabase } from '../db/supabase.js';

// Validación adicional del formulario de registro de jugadores
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const inputs = form.querySelectorAll("input[required]");

  // Validación en tiempo real
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      if (this.value.trim() === "") {
        this.style.borderColor = "#ef4444";
      } else {
        this.style.borderColor = "#2DB4A5";
      }
    });

    input.addEventListener("input", function () {
      if (this.style.borderColor === "rgb(239, 68, 68)") {
        this.style.borderColor = "#d1d5db";
      }
    });
  });

  // Validación del teléfono
  const telefonoInput = document.getElementById("telefono");
  telefonoInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Manejo del envío del formulario
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validar todos los campos
    let isValid = true;
    inputs.forEach((input) => {
      if (input.value.trim() === "") {
        input.style.borderColor = "#ef4444";
        isValid = false;
      }
    });

    if (isValid) {
      // Guardar datos en Supabase
      savePlayerData({
        nombres: form.querySelector('#nombres').value,
        apellidos: form.querySelector('#apellidos').value,
        telefono: form.querySelector('#telefono').value,
        correo: form.querySelector('#correo').value,
      });
    } else {
      alert("Por favor, completa todos los campos requeridos.");
    }
  });
});

// Función para guardar datos del jugador usando Supabase
async function savePlayerData(playerData) {
  console.log('Iniciando registro de jugador:', playerData);
  
  // Obtener referencia al botón y guardar texto original
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  
  try {
    // Mostrar indicador de carga
    submitButton.textContent = 'Guardando...';
    submitButton.disabled = true;

    console.log('Enviando datos a Supabase...');
    
    // Insertar datos en Supabase
    const { data, error } = await supabase
      .from('jugadores')
      .insert([
        {
          nombres: playerData.nombres,
          apellidos: playerData.apellidos,
          telefono: playerData.telefono,
          correo: playerData.correo
        }
      ]);

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    console.log('Datos guardados exitosamente:', data);
    
    // Éxito: guardar también en localStorage como respaldo
    localStorage.setItem('jugador', JSON.stringify(playerData));
    
    alert('¡Registro exitoso! Bienvenido a los juegos.');
    window.location.href = '/juegos';

  } catch (error) {
    console.error('Error completo al guardar:', error);
    console.error('Tipo de error:', typeof error);
    console.error('Mensaje del error:', error.message);
    
    // Manejar diferentes tipos de errores
    let errorMessage = 'Registro completado. Los datos se han guardado localmente.';
    
    if (error.message.includes('configuración de base de datos')) {
      errorMessage = 'Hay un problema de configuración. Tus datos se guardaron localmente y serán sincronizados más tarde.';
    } else if (error.code === 'PGRST301') {
      errorMessage = 'Error de conexión con la base de datos. Tus datos se guardaron localmente.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Error de conexión a internet. Tus datos se guardaron localmente.';
    }
    
    // En caso de error, guardar en localStorage como fallback
    localStorage.setItem('jugador', JSON.stringify(playerData));
    localStorage.setItem('jugador_sync_pending', 'true');
    
    alert(errorMessage);
    window.location.href = '/juegos';
    
  } finally {
    // Restaurar botón
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}
