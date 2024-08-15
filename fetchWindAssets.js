const axios = require('axios');
const { Parser } = require('json2csv');
const fs = require('fs');
const xlsx = require('xlsx'); // Add this line to import the xlsx library

const url = 'https://admin.modo.energy/v1/data-api/bm/common/library/';

async function fetchWindAssets(offset = 0, allResults = []) { // Accumulate all results
  const params = { limit: 100, technology: 'WIND', offset };

  try {
    const response = await axios.get(url, { params });
    const results = response.data.results.non_battery_asset || [];

    if (results.length > 0) {
      allResults.push(...results); // Add current results to the accumulator

      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(results);
      fs.appendFileSync('wind_assets.csv', csv);

      // Recursively fetch the next page
      await fetchWindAssets(offset + 100, allResults); 
    } else {
      console.log('All wind assets extracted.');

      // Save as JSON
      fs.writeFileSync('wind_assets.json', JSON.stringify(allResults, null, 2));

      // Save as XLSX (Excel)
      const ws = xlsx.utils.json_to_sheet(allResults);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Wind Assets");
      xlsx.writeFile(wb, 'wind_assets.xlsx');

      console.log('Data saved to wind_assets.csv, wind_assets.json, and wind_assets.xlsx');
    }
  } catch (error) {
    console.error(`Error fetching data (offset ${offset}):`, error);
  }
}

// Start the extraction process
fetchWindAssets();
