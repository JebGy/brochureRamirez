import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', import.meta.env.PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!import.meta.env.PUBLIC_SUPABASE_KEY);

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('jugadores')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Connection error:', connectionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database connection failed',
          details: connectionError.message,
          code: connectionError.code,
          hint: connectionError.hint
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Test table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('jugadores')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table error:', tableError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Table access failed',
          details: tableError.message,
          code: tableError.code,
          hint: tableError.hint
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database connection successful',
        tableExists: true,
        recordCount: connectionTest?.length || 0,
        sampleData: tableInfo
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};