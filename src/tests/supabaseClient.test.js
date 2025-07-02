import supabase from "../db/supabaseClient.js";

// Simple test function to check Supabase connection
async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Try to get the list of tables in the public schema
    const { data, error } = await supabase
      .from("pages") // Try a table that should exist in your schema
      .select("id") // Just select the ID column
      .limit(1); // Limit to 1 row for efficiency

    if (error) {
      if (error.code === "PGRST116") {
        // This error means the table doesn't exist, but connection works
        console.log(
          '✅ Connected to Supabase, but the "pages" table was not found.'
        );
        console.log("Try using a different table name in the test.");
        return true;
      } else {
        console.error("❌ Supabase connection test failed:", error.message);
        return false;
      }
    }

    console.log(
      '✅ Successfully connected to Supabase and queried the "pages" table!'
    );
    console.log(`Data: ${data ? JSON.stringify(data) : "No data returned"}`);
    return true;
  } catch (err) {
    console.error(
      "❌ Unexpected error testing Supabase connection:",
      err.message
    );
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then((success) => {
    if (success) {
      console.log("Supabase client is properly configured.");
    } else {
      console.log("Please check your Supabase configuration.");
    }
  })
  .catch((err) => {
    console.error("Test execution error:", err);
  });
