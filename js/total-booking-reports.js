// Total Booking Reports JavaScript
// Handles booking data loading, filtering, visualization, and PDF export

let allBookings = [];
let filteredBookings = [];
let monthlyChart = null;
let propertyChart = null;

// Pagination variables
let currentPage = 1;
const recordsPerPage = 5;

// Initialize the application
$(document).ready(function() {
    console.log('Document ready, initializing booking reports...');
    loadBookingData();
    setupEventListeners();
    initializePagination();
});

// Load booking data from booking-reports.json
// Updated: All status badges now use blue color (badge-info)
function loadBookingData() {
    console.log('Loading booking data from JSON...');
    
    // Try to load from booking-reports.json
    fetch('./data/booking-reports.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('JSON data loaded successfully:', data);
            
            if (data.bookings && Array.isArray(data.bookings)) {
                allBookings = data.bookings;
                console.log('Booking data loaded successfully:', allBookings.length, 'entries');
                
                filteredBookings = [...allBookings];
                generateReport();
            } else {
                throw new Error('Invalid data structure in JSON file');
            }
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
            console.log('Falling back to sample data');
            
            // Fallback to sample data
            allBookings = getSampleBookingData();
            filteredBookings = [...allBookings];
            generateReport();
        });
}



// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    $('#generateReport').on('click', function() {
        console.log('Generate Report button clicked');
        generateReport();
    });
    
    $('#exportPdf').on('click', function() {
        console.log('Export PDF button clicked');
        exportToPDF();
    });
    
    // Filter change listeners
    $('#yearSelect, #monthSelect, #propertySelect, #statusSelect').on('change', function() {
        console.log('Filter changed');
        applyFilters();
        generateReport();
    });
    
    console.log('Event listeners setup complete');
}

// Apply filters to booking data
function applyFilters() {
    const year = $('#yearSelect').val();
    const month = $('#monthSelect').val();
    const property = $('#propertySelect').val();
    const status = $('#statusSelect').val();
    
    console.log('Applying filters:', { year, month, property, status });
    
    filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        const bookingYear = bookingDate.getFullYear().toString();
        const bookingMonth = (bookingDate.getMonth() + 1).toString();
        
        const yearMatch = (!year || bookingYear === year);
        const monthMatch = (!month || bookingMonth === month);
        const propertyMatch = (!property || booking.propertyId === property);
        const statusMatch = (!status || booking.status === status);
        
        return yearMatch && monthMatch && propertyMatch && statusMatch;
    });
    
    console.log('Filtered bookings:', filteredBookings.length, 'of', allBookings.length);
    
    // Reset pagination to first page when filters are applied
    currentPage = 1;
    
    // Show debug info on page
    updateDebugInfo(year, month, property, status);
}

function updateDebugInfo(year, month, property, status) {
    let debugDiv = document.getElementById('debug-info');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = 'background: #e8f4fd; padding: 15px; margin: 10px; border: 1px solid #007bff; border-radius: 5px; font-family: monospace; font-size: 12px;';
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(debugDiv, container.firstChild);
        }
    }
    
    const marchBookings = allBookings.filter(b => {
        const date = new Date(b.bookingDate);
        return date.getFullYear() === 2024 && date.getMonth() === 2; // March is month 2 (0-indexed)
    });
    
    debugDiv.innerHTML = `
        <strong>🔍 FILTER DEBUG INFO:</strong><br>
        <strong>Active Filters:</strong> Year=${year || 'All'}, Month=${month || 'All'}, Property=${property || 'All'}, Status=${status || 'All'}<br>
        <strong>Total Bookings:</strong> ${allBookings.length}<br>
        <strong>March 2024 Bookings Available:</strong> ${marchBookings.length} (${marchBookings.map(b => b.bookingId).join(', ')})<br>
        <strong>Filtered Results:</strong> ${filteredBookings.length} bookings<br>
        <strong>Filtered IDs:</strong> ${filteredBookings.map(b => b.bookingId).join(', ') || 'None'}<br>
        <strong>Last Updated:</strong> ${new Date().toLocaleTimeString()}
    `;
}

// Generate the complete report
function generateReport() {
    console.log('Generating report with', filteredBookings.length, 'bookings');
    
    updateSummaryCards();
    renderCharts();
    populateBookingTable();
}

// Update summary cards with calculated metrics
function updateSummaryCards() {
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalGuests = filteredBookings.reduce((sum, booking) => sum + booking.guests, 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    $('#totalBookings').text(totalBookings);
    $('#totalRevenue').text('₹' + totalRevenue.toLocaleString());
    $('#totalGuests').text(totalGuests);
    $('#avgBookingValue').text('₹' + Math.round(avgBookingValue).toLocaleString());
}

// Render charts using Chart.js
function renderCharts() {
    renderMonthlyChart();
    renderPropertyChart();
}

// Render monthly booking trends chart
function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    console.log('Rendering monthly chart with filtered bookings:', filteredBookings.length);
    
    // Group bookings by month
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    filteredBookings.forEach(booking => {
        const date = new Date(booking.bookingDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        console.log(`Processing booking ${booking.bookingId}: ${booking.bookingDate} -> ${monthLabel}`);
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                label: monthLabel,
                bookings: 0,
                revenue: 0
            };
        }
        
        monthlyData[monthKey].bookings++;
        monthlyData[monthKey].revenue += booking.amount;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(key => monthlyData[key].label);
    const bookingCounts = sortedMonths.map(key => monthlyData[key].bookings);
    const revenues = sortedMonths.map(key => monthlyData[key].revenue);
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bookings',
                data: bookingCounts,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                yAxisID: 'y'
            }, {
                label: 'Revenue (₹)',
                data: revenues,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Bookings'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Render property distribution chart
function renderPropertyChart() {
    const ctx = document.getElementById('propertyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (propertyChart) {
        propertyChart.destroy();
    }
    
    // Group bookings by property
    const propertyData = {};
    const propertyNames = {
        'villa1': 'Nestle with Nature Villa',
        'villa2': 'Hustle in Hisspeed Villa',
        'budget': 'Bustle in Budget Property'
    };
    
    filteredBookings.forEach(booking => {
        const propertyName = propertyNames[booking.propertyId] || booking.propertyName;
        if (!propertyData[propertyName]) {
            propertyData[propertyName] = 0;
        }
        propertyData[propertyName]++;
    });
    
    const labels = Object.keys(propertyData);
    const data = Object.values(propertyData);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    propertyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Populate the detailed booking table
function populateBookingTable() {
    const tbody = $('#bookingTableBody');
    tbody.empty();
    
    // Calculate pagination
    const totalRecords = filteredBookings.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentPageData = filteredBookings.slice(startIndex, endIndex);
    
    // Populate table with current page data
    currentPageData.forEach(booking => {
        const statusBadge = getStatusBadge(booking.status);
        const propertyNames = {
            'villa1': 'Nestle with Nature Villa',
            'villa2': 'Hustle in Hisspeed Villa',
            'budget': 'Bustle in Budget Property'
        };
        const propertyName = propertyNames[booking.propertyId] || booking.propertyName;
        
        const row = `
            <tr>
                <td>${booking.bookingId}</td>
                <td>${propertyName}</td>
                <td>${booking.guestName}</td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${booking.guests}</td>
                <td>${statusBadge}</td>
                <td>₹${booking.amount.toLocaleString()}</td>
            </tr>
        `;
        tbody.append(row);
    });
    
    // Update pagination controls
    updatePaginationControls(totalRecords, totalPages);
}

// Update pagination controls
function updatePaginationControls(totalRecords, totalPages) {
    // Update record count info
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
    $('#currentPageInfo').text(`${startRecord}-${endRecord}`);
    $('#totalRecords').text(totalRecords);
    
    // Update pagination buttons
    const paginationControls = $('#paginationControls');
    
    // Clear existing page numbers (keep prev/next buttons)
    paginationControls.find('.page-number').remove();
    
    // Update prev button
    const prevButton = $('#prevPage');
    if (currentPage <= 1) {
        prevButton.addClass('disabled');
    } else {
        prevButton.removeClass('disabled');
    }
    
    // Update next button
    const nextButton = $('#nextPage');
    if (currentPage >= totalPages) {
        nextButton.addClass('disabled');
    } else {
        nextButton.removeClass('disabled');
    }
    
    // Add page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Insert page numbers before the next button
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`
            <li class="page-item page-number ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `);
        nextButton.before(pageItem);
    }
}

// Initialize pagination event handlers
function initializePagination() {
    // Previous button click
    $(document).on('click', '#prevPage a', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            populateBookingTable();
        }
    });
    
    // Next button click
    $(document).on('click', '#nextPage a', function(e) {
        e.preventDefault();
        const totalPages = Math.ceil(filteredBookings.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            populateBookingTable();
        }
    });
    
    // Page number click
    $(document).on('click', '.page-number a', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (page !== currentPage) {
            currentPage = page;
            populateBookingTable();
        }
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="badge badge-info">Completed</span>',
        'confirmed': '<span class="badge badge-info">Confirmed</span>',
        'pending': '<span class="badge badge-info">Pending</span>',
        'cancelled': '<span class="badge badge-info">Cancelled</span>'
    };
    return badges[status] || `<span class="badge badge-info">${status}</span>`;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Export report to PDF using jsPDF (similar to pdfgen.js approach)
function exportToPDF() {
    console.log('=== exportToPDF function called ===');
    console.log('Checking jsPDF availability:', typeof window.jspdf);
    console.log('Checking jsPDF.jsPDF:', typeof window.jspdf?.jsPDF);
    
    try {
        const { jsPDF } = window.jspdf;
        console.log('jsPDF constructor:', typeof jsPDF);
        
        if (!jsPDF) {
            console.error('jsPDF is not available');
            alert('PDF library is not loaded. Please refresh the page and try again.');
            return;
        }
        
        console.log('Creating new jsPDF instance...');
        const doc = new jsPDF();
        console.log('jsPDF instance created successfully');
        
        console.log('filteredBookings for PDF:', filteredBookings.length, 'items');
        
        // Set document properties (similar to pdfgen.js)
        doc.setProperties({
            title: 'BW Stays - Booking Report',
            subject: 'Booking Analytics Report',
            author: 'Black and White Stays',
            keywords: 'booking, report, analytics, bwstays',
            creator: 'BW Stays Booking System'
        });
        
        console.log('Document properties set');
        
        // Add header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Black and White Stays', 20, 20);
        
        doc.setFontSize(16);
        doc.text('Booking Report', 20, 30);
        
        // Add filter information
        doc.setFontSize(10);
        const year = $('#yearSelect').val() || 'All Years';
        const month = $('#monthSelect option:selected').text() || 'All Months';
        const property = $('#propertySelect option:selected').text() || 'All Properties';
        const status = $('#statusSelect option:selected').text() || 'All Status';
        
        doc.text(`Filters: Year: ${year}, Month: ${month}, Property: ${property}, Status: ${status}`, 20, 40);
        
        // Add summary data
        const totalBookings = filteredBookings.length;
        const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.amount, 0);
        const totalGuests = filteredBookings.reduce((sum, booking) => sum + booking.guests, 0);
        const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        
        doc.setFontSize(12);
        doc.text('Summary:', 20, 55);
        doc.setFontSize(10);
        doc.text(`Total Bookings: ${totalBookings}`, 20, 65);
        doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 20, 72);
        doc.text(`Total Guests: ${totalGuests}`, 20, 79);
        doc.text(`Average Booking Value: ₹${Math.round(avgBookingValue).toLocaleString()}`, 20, 86);
        
        // Prepare table data
        const tableData = filteredBookings.map(booking => {
            const propertyNames = {
                'villa1': 'Nestle with Nature Villa',
                'villa2': 'Hustle in Hisspeed Villa',
                'budget': 'Bustle in Budget Property'
            };
            const propertyName = propertyNames[booking.propertyId] || booking.propertyName;
            
            return [
                booking.bookingId,
                propertyName,
                booking.guestName,
                formatDate(booking.checkIn),
                formatDate(booking.checkOut),
                booking.guests.toString(),
                booking.status,
                `₹${booking.amount.toLocaleString()}`
            ];
        });
        
        console.log('Table data prepared, rows:', tableData.length);
        
        // Check if autoTable is available
        if (typeof doc.autoTable !== 'function') {
            console.error('autoTable plugin is not available');
            alert('PDF table plugin is not loaded. Please refresh the page and try again.');
            return;
        }
        
        // Add table using autoTable plugin (similar to pdfgen.js table approach)
        doc.autoTable({
            head: [['Booking ID', 'Property', 'Guest Name', 'Check-in', 'Check-out', 'Guests', 'Status', 'Amount']],
            body: tableData,
            startY: 95,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 35 },
                2: { cellWidth: 25 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 15 },
                6: { cellWidth: 20 },
                7: { cellWidth: 25 }
            }
        });
        
        console.log('Table added to PDF');
        
        // Add footer (similar to pdfgen.js)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
            doc.text('Black and White Stays - Booking Report', doc.internal.pageSize.width / 2 - 40, doc.internal.pageSize.height - 10);
        }
        
        console.log('Footer added to PDF');
        
        // Save the PDF (similar to pdfgen.js naming convention)
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `bwBookingReport_${currentDate}.pdf`;
        console.log('Saving PDF as:', filename);
        doc.save(filename);
        
        console.log('=== PDF export completed successfully ===');
        
    } catch (error) {
        console.error('Error in exportToPDF:', error);
        alert('An error occurred while generating the PDF. Please check the console for details.');
    }
}

// Sample booking data (fallback)
function getSampleBookingData() {
    return [
        {
            bookingId: "BW2024001",
            propertyId: "villa1",
            propertyName: "Nestle with Nature Villa",
            guestName: "Rajesh Kumar",
            checkIn: "2024-01-15",
            checkOut: "2024-01-18",
            guests: 4,
            status: "completed",
            amount: 25000,
            bookingDate: "2024-01-10"
        },
        {
            bookingId: "BW2024002",
            propertyId: "villa2",
            propertyName: "Hustle in Hisspeed Villa",
            guestName: "Priya Sharma",
            checkIn: "2024-02-20",
            checkOut: "2024-02-23",
            guests: 6,
            status: "confirmed",
            amount: 35000,
            bookingDate: "2024-02-15"
        },
        {
            bookingId: "BW2024003",
            propertyId: "budget",
            propertyName: "Bustle in Budget Property",
            guestName: "Amit Patel",
            checkIn: "2024-03-10",
            checkOut: "2024-03-12",
            guests: 2,
            status: "pending",
            amount: 8000,
            bookingDate: "2024-03-05"
        },
        {
            bookingId: "BW2024004",
            propertyId: "villa1",
            propertyName: "Nestle with Nature Villa",
            guestName: "Sunita Gupta",
            checkIn: "2024-04-05",
            checkOut: "2024-04-08",
            guests: 5,
            status: "cancelled",
            amount: 28000,
            bookingDate: "2024-03-28"
        },
        {
            bookingId: "BW2024005",
            propertyId: "villa2",
            propertyName: "Hustle in Hisspeed Villa",
            guestName: "Vikram Singh",
            checkIn: "2024-05-12",
            checkOut: "2024-05-16",
            guests: 8,
            status: "completed",
            amount: 42000,
            bookingDate: "2024-05-01"
        }
    ];
}