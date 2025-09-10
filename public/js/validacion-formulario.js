// Validación del lado del cliente para mejorar la experiencia del usuario
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

  // Validación antes del envío
  form.addEventListener("submit", function (e) {
    let isValid = true;
    inputs.forEach((input) => {
      if (input.value.trim() === "") {
        input.style.borderColor = "#ef4444";
        isValid = false;
      }
    });

    if (!isValid) {
      e.preventDefault();
      alert("Por favor, completa todos los campos requeridos.");
      return false;
    }
    
    // Asegurar que el formulario se envíe con el Content-Type correcto
    // No prevenir el envío por defecto si la validación pasa
    return true;
  });
});