var TABLE_DATA = [];
var SECTION1_DATA = [];
var SECTION2_DATA = [];
var OVERALL_DATA = [];
const rowsPerPage = 10;
let currentPage = 1;

// Set up the date format for display
var formatDate = d3.timeFormat("%B %d, %Y %H:%M:%S");

async function fetchData() {
    try {
        const response = await fetch('fetch_data.php');

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        // Parse the JSON data
        TABLE_DATA = await response.json();

        // Format the data to match the specified structure
        TABLE_DATA = TABLE_DATA.map(data => ({
            SensorID: data.SensorID,
            Location: data.Location,
            WaterUsed: data.WaterUsed,
            FlowRate: data.FlowRate,
            // Convert TimeRecorded to a Date object and then format it
            TimeRecorded: formatDate(new Date(data.TimeRecorded))
        }));

        // Split data into sections
        SECTION1_DATA = TABLE_DATA.filter(data => data.Location === "Section 1");
        SECTION2_DATA = TABLE_DATA.filter(data => data.Location !== "Section 1");

        // Sort each section by descending SensorID
        SECTION1_DATA.sort((a, b) => b.SensorID - a.SensorID);
        SECTION2_DATA.sort((a, b) => b.SensorID - a.SensorID);
        
        OVERALL_DATA = TABLE_DATA

        // Sort OVERALL_DATA by descending order of SensorID
        OVERALL_DATA.sort((a, b) => {
            return b.SensorID - a.SensorID;
        });
    } catch (error) {
        console.error(error);
    }
}

// Function to render the table with specific data
async function renderTable(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);

    pageData.forEach((row, index) => {
        const tr = document.createElement('tr');
        const rowIndex = start + index + 1; // Calculate the row ID
        tr.innerHTML = `
            <td>${rowIndex}</td>
            <td>${row.SensorID}</td>
            <td>${row.Location}</td>
            <td>${row.WaterUsed}</td>
            <td>${row.FlowRate}</td>
            <td>${row.TimeRecorded}</td>
        `;
        tableBody.appendChild(tr);
    });

    updatePagination(data);
}

function updatePagination(data) {
    const pageInfo = document.getElementById('page-info');
    const totalPages = Math.ceil(data.length / rowsPerPage);
    pageInfo.textContent = `Result ${currentPage} of ${totalPages}`;

    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;
}

// Event listeners for buttons to change table data
document.getElementById('loadData').addEventListener('click', async function () {
    await fetchData(); // Ensure data is fetched before rendering
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    currentPage = 1; // Reset to the first page
    renderTable(OVERALL_DATA);
});

document.getElementById('loadNode1').addEventListener('click', async function () {
    await fetchData(); // Ensure data is fetched before rendering
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    currentPage = 1; // Reset to the first page
    renderTable(SECTION1_DATA);
});

document.getElementById('loadNode2').addEventListener('click', async function () {
    await fetchData(); // Ensure data is fetched before rendering
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    currentPage = 1; // Reset to the first page
    renderTable(SECTION2_DATA);
});

document.getElementById('prev-btn').addEventListener('click', async () => {
    const activeButton = document.querySelector(".nav-item.active");
    let activeData;
    
    if (activeButton.id === 'loadNode1') {
        activeData = SECTION1_DATA;
    } else if (activeButton.id === 'loadNode2') {
        activeData = SECTION2_DATA;
    } else {
        activeData = OVERALL_DATA;
    }

    if (currentPage > 1) {
        currentPage--;
        renderTable(activeData);
    }
});

document.getElementById('next-btn').addEventListener('click', async () => {
    const activeButton = document.querySelector(".nav-item.active");
    let activeData;
    
    if (activeButton.id === 'loadNode1') {
        activeData = SECTION1_DATA;
    } else if (activeButton.id === 'loadNode2') {
        activeData = SECTION2_DATA;
    } else {
        activeData = OVERALL_DATA;
    }

    const totalPages = Math.ceil(activeData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable(activeData);
    }
});

// Initial data fetch and table render
fetchData().then(() => {
    document.getElementById('loadData').classList.add("active"); // Set Overall as active by default
    renderTable(OVERALL_DATA);
});
