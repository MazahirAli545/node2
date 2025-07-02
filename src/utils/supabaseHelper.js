import supabase from "../db/supabaseClient.js";

/**
 * Helper functions for Supabase operations
 */
const supabaseHelper = {
  /**
   * Fetch data from a table with optional filters
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @param {string|string[]} options.select - Columns to select
   * @param {Object} options.filters - Filter conditions
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.orderBy - Column to order by
   * @param {boolean} options.ascending - Sort order (true for ascending)
   * @returns {Promise<{data: Array, error: Object}>} - Query result
   */
  async fetchData(table, options = {}) {
    try {
      const {
        select = "*",
        filters = {},
        limit = 100,
        offset = 0,
        orderBy = "id",
        ascending = true,
      } = options;

      // Start building the query
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Apply ordering
      query = query.order(orderBy, { ascending });

      // Execute the query
      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching data from ${table}:`, error.message);
      return { data: null, error };
    }
  },

  /**
   * Insert data into a table
   * @param {string} table - Table name
   * @param {Object|Object[]} data - Data to insert
   * @returns {Promise<{data: Array, error: Object}>} - Insert result
   */
  async insertData(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error inserting data into ${table}:`, error.message);
      return { data: null, error };
    }
  },

  /**
   * Update data in a table
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} match - Conditions to match records
   * @returns {Promise<{data: Array, error: Object}>} - Update result
   */
  async updateData(table, data, match) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(match)
        .select();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error updating data in ${table}:`, error.message);
      return { data: null, error };
    }
  },

  /**
   * Delete data from a table
   * @param {string} table - Table name
   * @param {Object} match - Conditions to match records
   * @returns {Promise<{data: Array, error: Object}>} - Delete result
   */
  async deleteData(table, match) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .match(match)
        .select();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error deleting data from ${table}:`, error.message);
      return { data: null, error };
    }
  },
};

export default supabaseHelper;
