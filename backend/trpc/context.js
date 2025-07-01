import { supabase } from '../db/supabase.js';

export async function createContext({ req, res }) {
  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token with Supabase
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (!error && authUser) {
        user = authUser;
      }
    } catch (error) {
      console.log('Auth error:', error.message);
    }
  }

  return {
    req,
    res,
    user,
    supabase
  };
}