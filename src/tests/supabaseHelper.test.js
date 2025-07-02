import supabaseHelper from "../utils/supabaseHelper.js";

// Test the helper functions
async function testSupabaseHelper() {
  try {
    console.log("Testing Supabase helper functions...");

    // Test fetchData function
    console.log("\n1. Testing fetchData:");
    const { data: Otp, error: fetchError } = await supabaseHelper.fetchData(
      "Otp",
      {
        limit: 5,
        orderBy: "id",
        ascending: true,
      }
    );

    if (fetchError) {
      console.error("❌ fetchData test failed:", fetchError.message);
    } else {
      console.log("✅ fetchData test successful!");
      console.log(`Retrieved ${pages?.length || 0} records`);
      if (pages?.length > 0) {
        console.log("First record:", JSON.stringify(pages[0]));
      }
    }

    // You can uncomment and modify these tests as needed
    /*
    // Test insertData function (be careful with this in production)
    console.log('\n2. Testing insertData:');
    const testData = {
      title: 'Test Page',
      link_url: '/test-page-' + Date.now(),
      active_yn: 1,
      created_by: 'test',
      created_date: new Date()
    };
    
    const { data: inserted, error: insertError } = await supabaseHelper.insertData('pages', testData);
    
    if (insertError) {
      console.error('❌ insertData test failed:', insertError.message);
    } else {
      console.log('✅ insertData test successful!');
      console.log('Inserted record:', JSON.stringify(inserted[0]));
      
      // Save the ID for update and delete tests
      const insertedId = inserted[0].id;
      
      // Test updateData function
      console.log('\n3. Testing updateData:');
      const { data: updated, error: updateError } = await supabaseHelper.updateData(
        'pages',
        { title: 'Updated Test Page' },
        { id: insertedId }
      );
      
      if (updateError) {
        console.error('❌ updateData test failed:', updateError.message);
      } else {
        console.log('✅ updateData test successful!');
        console.log('Updated record:', JSON.stringify(updated[0]));
      }
      
      // Test deleteData function
      console.log('\n4. Testing deleteData:');
      const { data: deleted, error: deleteError } = await supabaseHelper.deleteData(
        'pages',
        { id: insertedId }
      );
      
      if (deleteError) {
        console.error('❌ deleteData test failed:', deleteError.message);
      } else {
        console.log('✅ deleteData test successful!');
        console.log('Deleted record:', JSON.stringify(deleted[0]));
      }
    }
    */

    return true;
  } catch (err) {
    console.error("❌ Unexpected error testing Supabase helper:", err.message);
    return false;
  }
}

// Run the test
testSupabaseHelper()
  .then((success) => {
    if (success) {
      console.log("\nSupabase helper functions are working properly.");
    } else {
      console.log(
        "\nPlease check your Supabase configuration and helper functions."
      );
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
