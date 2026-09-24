'use strict';
// Replace with your Supabase project values.
// Found at: supabase.com/dashboard/project/YOUR_PROJECT/settings/api
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

(function(){
  if(!window.supabase){
    console.warn('supabase-js CDN not loaded — cloud features disabled');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Auth helpers
  window.SupaAuth = {
    getSession:          ()         => client.auth.getSession(),
    getUser:             ()         => client.auth.getUser(),
    signInWithPassword:  (em, pw)   => client.auth.signInWithPassword({ email:em, password:pw }),
    signUp:              (em, pw)   => client.auth.signUp({ email:em, password:pw }),
    signInWithOtp:       (em)       => client.auth.signInWithOtp({ email:em, shouldCreateUser:true }),
    signOut:             ()         => client.auth.signOut(),
    onAuthStateChange:   (cb)       => client.auth.onAuthStateChange(cb),
  };

  // Data helpers — each user owns exactly one row in user_data (created by DB trigger on signup)
  window.SupaData = {
    load: async () => {
      const { data:{ user } } = await client.auth.getUser();
      if(!user) return null;
      const { data, error } = await client
        .from('user_data')
        .select('settings, data')
        .eq('id', user.id)
        .single();
      if(error){ console.warn('SupaData.load:', error.message); return null; }
      return data;
    },

    saveSettings: async (settingsObj) => {
      const { data:{ user } } = await client.auth.getUser();
      if(!user) return;
      const { error } = await client
        .from('user_data')
        .update({ settings: settingsObj, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if(error) console.warn('SupaData.saveSettings:', error.message);
    },

    saveData: async (dataObj) => {
      const { data:{ user } } = await client.auth.getUser();
      if(!user) return;
      const { error } = await client
        .from('user_data')
        .update({ data: dataObj, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if(error) console.warn('SupaData.saveData:', error.message);
    },
  };
})();
