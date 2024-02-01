let dictionary = {};

function loadDictionary() {
    fetch('updated_manchu_modified.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            dictionary = data;
            console.log('Dictionary loaded:', dictionary);
        })
        .catch(error => {
            console.error('There was a problem loading the dictionary:', error);
        });
}

loadDictionary();

let selectedFont = 'XM_BiaoHei';

function showVerticalText(manchuText) {
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '60%';
  popup.style.left = '70%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.border = '1px solid black';
  popup.style.backgroundColor = 'white';
  popup.style.padding = '30px';
  popup.style.zIndex = '1000';

  const textContainer = document.createElement('div');

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Apply vertical text styles only if it's not Safari boo Safari
  if (!isSafari) {
      textContainer.style.writingMode = 'vertical-rl';
      textContainer.style.textOrientation = 'upright';
      textContainer.style.webkitWritingMode = 'vertical-rl';
      textContainer.style.mozWritingMode = 'vertical-rl';
  }

  textContainer.textContent = manchuText;
  textContainer.style.fontSize = '30px';
  textContainer.style.fontFamily = selectedFont; // Ensure selectedFont is defined
  textContainer.style.marginBottom = '20px'; 

  popup.appendChild(textContainer);

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = function() {
      document.body.removeChild(popup);
  };

  popup.appendChild(closeButton);

  document.body.appendChild(popup);
}


function searchDictionary() {
  const input = document.getElementById('search-input').value.toLowerCase();
  const isWholeWord = document.getElementById('whole-word-toggle').checked;
  const selectedLanguage = document.getElementById('language-select').value; // Get the selected language
  const resultsDiv = document.getElementById('results');
  const resultsArray = []; // Store results along with their scores
  resultsDiv.innerHTML = ''; // Clear previous results

  // Add a counter to limit displayed results
  let resultCounter = 0;

  for (const [romanized, [manchu, english]] of Object.entries(dictionary)) {
      let score = 0; // Initialize score for this entry

      let words;
      let currentField;
      if (selectedLanguage === 'romanized-manchu') {
          currentField = romanized.toLowerCase();
          words = currentField.split(/\s+/);
      } else if (selectedLanguage === 'manchu-script') {
          currentField = manchu.toLowerCase();
          words = currentField.split(/\s+/);
      } else if (selectedLanguage === 'english') {
          currentField = english.toLowerCase();
          words = currentField.split(/\s+/);
      }

      // Check for whole word match
      if (isWholeWord && words.includes(input)) {
          score = 2; // Higher score for exact whole word match
      } 
      // Check for partial match if not restricted to whole words
      else if (!isWholeWord && currentField.includes(input)) {
          score = 1; // Lower score for partial match
      }

      if (score > 0) {
          const resultHtml = `
              <div style="border: 1px solid #000; padding: 10px;">
                  <strong>Romanized:</strong> ${romanized} <br>
                  <strong>Manchu:</strong> ${manchu} <br>
                  <strong>English:</strong> ${english}<br>
                  <strong>Check Buleku: </strong> <a href="https://buleku.org/detail/${romanized}" target="_blank" rel="noopener noreferrer">here</a><br>
                  <button onclick="showVerticalText('${manchu}')">Make Larger</button><br><br><br>
              </div>`;
          resultsArray.push({ html: resultHtml, score: score });
          
          // Increment the result counter
          resultCounter++;

          // Check if we've reached the limit (e.g., 30)
          if (resultCounter >= 30) {
              break; // Break the loop if the limit is reached
          }
      }
  }

  // Sort results by their score
  resultsArray.sort((a, b) => b.score - a.score);

  // Append sorted results to resultsDiv
  for (const result of resultsArray) {
      resultsDiv.innerHTML += result.html;
  }
}


const fontSelector = document.getElementById('font-select');
const textContainer = document.getElementById('text-container');

fontSelector.addEventListener('change', () => {
    selectedFont = fontSelector.value;

    textContainer.style.fontFamily = selectedFont;
});

function changeFont() {
    selectedFont = document.getElementById("font-select").value;

    const textContainers = document.querySelectorAll('.vertical-text');
    textContainers.forEach(container => {
        container.style.fontFamily = selectedFont;
    });
}

document.getElementById('search-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        searchDictionary();
    }
});

document.getElementById('search-button').addEventListener('click', searchDictionary);

window.onload = function () {
    changeFont();
};
