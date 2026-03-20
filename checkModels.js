import fs from 'fs';
async function checkModels() {
  const KEY = "AIzaSyDwx2Og4GqDP5QvBR2oo_E9Yeh6lD9E-2M";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
    const data = await response.json();
    fs.writeFileSync('models.txt', data.models.map(m => m.name).join("\n"), 'utf8');
    console.log("Written to models.txt");
  } catch (e) {
    console.error(e);
  }
}

checkModels();
