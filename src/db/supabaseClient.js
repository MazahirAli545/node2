import { createClient } from "@supabase/supabase-js";

// Replace with your actual values
const supabaseUrl = "https://qknjyjnyccrsfwdolbkt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbmp5am55Y2Nyc2Z3ZG9sYmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyODAyNTAsImV4cCI6MjA2Njg1NjI1MH0.FNt91Lia5XO2izX39L-3JX7zWf-DOWNK0sStKUYeVMI"; // your anon/public key

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
