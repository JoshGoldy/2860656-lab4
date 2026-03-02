const countryInput = document.getElementById("country-input");
const searchBtn = document.getElementById("search-btn");
const spinner = document.getElementById("loading-spinner");
const countryInfo = document.getElementById("country-info");
const borderingCountries = document.getElementById("bordering-countries");
const errorMessage = document.getElementById("error-message");

function showSpinner() {
  spinner.classList.remove("hidden");
}

function hideSpinner() {
  spinner.classList.add("hidden");
}

function clearUI() {
  countryInfo.innerHTML = "";
  borderingCountries.innerHTML = "";
  errorMessage.textContent = "";
}

function showError(message) {
  errorMessage.textContent = message;
}

async function fetchCountryByName(countryName) {
  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(
    countryName.trim()
  )}`;
  const response = await fetch(url);

  // REST Countries returns 404 for not found
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Country not found. Please check the spelling and try again.");
    }
    throw new Error("Something went wrong while fetching country data.");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No results returned for that country.");
  }

  // Pick the first result
  return data[0];
}

async function fetchCountryByCode(code) {
  const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch bordering country details.");
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Bordering country data missing.");
  }

  return data[0];
}

function renderCountry(country) {
  const name = country?.name?.common ?? "Unknown";
  const capital = Array.isArray(country?.capital) && country.capital.length > 0
    ? country.capital[0]
    : "N/A";
  const population =
    typeof country?.population === "number"
      ? country.population.toLocaleString()
      : "N/A";
  const region = country?.region ?? "N/A";
  const flag = country?.flags?.svg || country?.flags?.png || "";

  countryInfo.innerHTML = `
    <h2>${name}</h2>
    <p><strong>Capital:</strong> ${capital}</p>
    <p><strong>Population:</strong> ${population}</p>
    <p><strong>Region:</strong> ${region}</p>
    ${
      flag
        ? `<img src="${flag}" alt="${name} flag" />`
        : `<p><em>Flag unavailable</em></p>`
    }
  `;
}

function renderBorderingCountries(neighbors) {
  if (!neighbors || neighbors.length === 0) {
    borderingCountries.innerHTML = `<p><em>No bordering countries found.</em></p>`;
    return;
  }

  borderingCountries.innerHTML = neighbors
    .map((c) => {
      const name = c?.name?.common ?? "Unknown";
      const flag = c?.flags?.svg || c?.flags?.png || "";
      return `
        <div class="border-card">
          ${
            flag
              ? `<img src="${flag}" alt="${name} flag" />`
              : `<div class="flag-placeholder">No flag</div>`
          }
          <p>${name}</p>
        </div>
      `;
    })
    .join("");
}

async function searchCountry(countryName) {
  try {
    clearUI();

    if (!countryName || !countryName.trim()) {
      showError("Please enter a country name.");
      return;
    }

    showSpinner();

    // Fetch main country
    const country = await fetchCountryByName(countryName);
    renderCountry(country);

    // Fetch bordering countries 
    const borderCodes = Array.isArray(country?.borders) ? country.borders : [];

    if (borderCodes.length === 0) {
      renderBorderingCountries([]);
      return;
    }

    // Fetch all borders
    const neighborPromises = borderCodes.map((code) => fetchCountryByCode(code));
    const neighbors = await Promise.all(neighborPromises);

    renderBorderingCountries(neighbors);
  } catch (error) {
    showError(error.message || "An unexpected error occurred.");
  } finally {
    hideSpinner();
  }
}

// Search trigger: button click
searchBtn.addEventListener("click", () => {
  const country = countryInput.value;
  searchCountry(country);
});

// Search trigger: press Enter in input
countryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchCountry(countryInput.value);
  }
});