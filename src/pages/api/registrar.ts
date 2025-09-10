import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Mark this endpoint as server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Better error handling for JSON parsing
    let body;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format in request body',
          success: false 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const { nombres, apellidos, telefono, correo } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombres || !apellidos || !telefono || !correo) {
      return new Response(
        JSON.stringify({ 
          error: 'Todos los campos son requeridos',
          success: false 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return new Response(
        JSON.stringify({ 
          error: 'El formato del correo electrónico no es válido',
          success: false 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validar formato de teléfono (solo números, entre 9 y 15 dígitos)
    const telefonoRegex = /^[0-9]{9,15}$/;
    if (!telefonoRegex.test(telefono)) {
      return new Response(
        JSON.stringify({ 
          error: 'El número de teléfono debe contener solo números y tener entre 9 y 15 dígitos',
          success: false 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Insertar datos en Supabase
    const { data, error } = await supabase
      .from('jugadores')
      .insert([
        {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefono: telefono.trim(),
          correo: correo.trim().toLowerCase(),
          fecha_registro: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error de Supabase:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error al guardar en la base de datos',
          success: false,
          details: error.message
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Respuesta exitosa
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Jugador registrado exitosamente',
        data: data[0]
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error en API registrar:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        success: false
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};