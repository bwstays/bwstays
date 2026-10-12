const brandColors = {
    primary: '#64a19d',
    secondary: '#4a7c87',
    accent1: '#8bc4c0',
    accent2: '#a8d5d1',
    complementary: '#c4896b',
    analogous1: '#64a164',
    analogous2: '#649da1',
    success: '#64a164',
    warning: '#c4896b',
    danger: '#a67c7c',
    info: '#649da1'
};
const propertyConfig = {
    all: { name: 'All villas', color: brandColors.primary },
    villa1: { name: 'Luxury Villa 1 - Ground Floor', color: brandColors.primary },
    villa2: { name: 'Luxury Villa 2 - First Floor', color: brandColors.complementary }
};
// The booking calendar records dates only; guest, party size and amount are null.
function bwMoney(v) {
    return v == null ? '\u2014' : '\u20b9' + Number(v).toLocaleString();
}
function bwNum(v) {
    return v == null ? '\u2014' : String(v);
}
function bwText(v) {
    return v == null || v === '' ? '\u2014' : String(v);
}
function bwNights(b) {
    if (b.nights != null) return b.nights;
    var a = Date.parse(b.checkIn), c = Date.parse(b.checkOut);
    return isFinite(a) && isFinite(c) ? Math.max(1, Math.round((c - a) / 86400000)) : 1;
}
let allBookings = [];
let filteredBookings = [];
let monthlyChart = null;
let propertyChart = null;
let currentPage = 1;
const recordsPerPage = 5;
$(document).ready(function() {
    loadBookingData();
    setupEventListeners();
    initializePagination();
});
function loadBookingData() {
    fetch('https://www.bwstays.com/data/booking-reports.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.bookings && Array.isArray(data.bookings)) {
                if (data.note && !$('#bwReportNote').length) {
                    $('#totalBookings').closest('.row').before(
                        '<div id="bwReportNote" class="alert alert-info" role="note">' +
                        $('<div>').text(data.note + ' Latest calendar entry: ' + (data.latest_entry || 'none') + '.').html() + '</div>');
                }
                allBookings = data.bookings;
                filteredBookings = [...allBookings];
                generateReport();
            } else {
                throw new Error('Invalid data structure in JSON file');
            }
        })
        .catch(error => {
            allBookings = [];
            filteredBookings = [...allBookings];
            generateReport();
        });
}
function setupEventListeners() {
    $('#generateReport').on('click', function() {
        generateReport();
    });
    $('#exportPdf').on('click', function() {
        exportToPDF();
    });
    $('#yearSelect, #monthSelect, #propertySelect, #statusSelect').on('change', function() {
        applyFilters();
        generateReport();
    });
}
function applyFilters() {
    const year = $('#yearSelect').val();
    const month = $('#monthSelect').val();
    const property = $('#propertySelect').val();
    const status = $('#statusSelect').val();
    filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate || booking.checkIn);
        const bookingYear = bookingDate.getFullYear().toString();
        const bookingMonth = (bookingDate.getMonth() + 1).toString();
        const yearMatch = (!year || bookingYear === year);
        const monthMatch = (!month || bookingMonth === month);
        const propertyMatch = (!property || booking.propertyId === property);
        const statusMatch = (!status || booking.status === status);
        return yearMatch && monthMatch && propertyMatch && statusMatch;
    });
    currentPage = 1;
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
        return date.getFullYear() === 2024 && date.getMonth() === 2; 
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
function generateReport() {
    updateSummaryCards();
    renderCharts();
    populateBookingTable();
}
function updateSummaryCards() {
    const totalBookings = filteredBookings.length;
    const withAmount = filteredBookings.filter(booking => booking.amount != null);
    const withGuests = filteredBookings.filter(booking => booking.guests != null);
    const totalRevenue = withAmount.reduce((sum, booking) => sum + booking.amount, 0);
    const totalGuests = withGuests.reduce((sum, booking) => sum + booking.guests, 0);
    const bookedNights = filteredBookings.filter(booking => booking.status !== 'closed').reduce((sum, booking) => sum + bwNights(booking), 0);
    $('#totalBookings').text(totalBookings);
    $('#totalRevenue').text(withAmount.length ? '₹' + totalRevenue.toLocaleString() : '—');
    $('#totalGuests').text(withGuests.length ? totalGuests : '—');
    $('#avgBookingValue').text(withAmount.length ? '₹' + Math.round(totalRevenue / withAmount.length).toLocaleString() : bookedNights + ' nights');
}
function renderCharts() {
    renderMonthlyChart();
    renderPropertyChart();
}
function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    filteredBookings.forEach(booking => {
        const date = new Date(booking.bookingDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                label: monthLabel,
                bookings: 0,
                revenue: 0
            };
        }
        monthlyData[monthKey].bookings++;
        monthlyData[monthKey].revenue += booking.amount || 0;
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
                borderColor: brandColors.primary,
                backgroundColor: brandColors.primary + '33', 
                pointBackgroundColor: brandColors.primary,
                pointBorderColor: brandColors.primary,
                pointHoverBackgroundColor: brandColors.primary,
                pointHoverBorderColor: brandColors.primary,
                tension: 0.3,
                yAxisID: 'y'
            }, {
                label: 'Revenue (₹)',
                data: revenues,
                borderColor: brandColors.complementary,
                backgroundColor: brandColors.complementary + '33', 
                pointBackgroundColor: brandColors.complementary,
                pointBorderColor: brandColors.complementary,
                pointHoverBackgroundColor: brandColors.complementary,
                pointHoverBorderColor: brandColors.complementary,
                tension: 0.3,
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
function renderPropertyChart() {
    const ctx = document.getElementById('propertyChart').getContext('2d');
    if (propertyChart) {
        propertyChart.destroy();
    }
    const statusDisplayNames = {
        completed: 'Completed',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        pending: 'Pending'
    };
    const statusColors = {
        completed: brandColors.success,
        confirmed: brandColors.info,
        cancelled: brandColors.danger,
        pending: brandColors.warning
    };
    const statusCounts = { completed: 0, confirmed: 0, cancelled: 0, pending: 0 };
    filteredBookings.forEach(booking => {
        const s = booking.status;
        if (s && Object.prototype.hasOwnProperty.call(statusCounts, s)) {
            statusCounts[s] += 1;
        }
    });
    const labels = [];
    const data = [];
    const colors = [];
    Object.keys(statusCounts).forEach(status => {
        const count = statusCounts[status];
        if (count > 0) {
            labels.push(statusDisplayNames[status]);
            data.push(count);
            colors.push(statusColors[status]);
        }
    });
    const totalCount = data.reduce((sum, v) => sum + v, 0);
    propertyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 2,
                hoverBackgroundColor: colors.map(color => color + 'CC'),
                hoverBorderColor: colors,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        font: { size: 12, weight: '500' },
                        generateLabels: function(chart) {
                            const dataObj = chart.data;
                            if (dataObj.labels.length && dataObj.datasets.length) {
                                return dataObj.labels.map((label, i) => {
                                    const dataset = dataObj.datasets[0];
                                    const value = dataset.data[i];
                                    const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: dataset.backgroundColor[i],
                                        strokeStyle: dataset.borderColor[i],
                                        lineWidth: dataset.borderWidth,
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0;
                            return [
                                `${context.label}`,
                                `Bookings: ${value}`,
                                `Share: ${percentage}%`
                            ];
                        }
                    }
                }
            },
            layout: {
                padding: { left: 10, right: 10, top: 10, bottom: 10 }
            }
        }
    });
}
function populateBookingTable() {
    const tbody = $('#bookingTableBody');
    tbody.empty();
    const totalRecords = filteredBookings.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentPageData = filteredBookings.slice(startIndex, endIndex);
    currentPageData.forEach(booking => {
        const statusBadge = getStatusBadge(booking.status);
        const propertyName = (propertyConfig[booking.propertyId] || {}).name || booking.propertyName;
        const row = `
            <tr>
                <td>${booking.bookingId}</td>
                <td>${propertyName}</td>
                <td>${bwText(booking.guestName)}</td>
                <td>${formatDate(booking.checkIn)}</td>
                <td>${formatDate(booking.checkOut)}</td>
                <td>${bwNum(booking.guests)}</td>
                <td>${statusBadge}</td>
                <td>${bwMoney(booking.amount)}</td>
            </tr>
        `;
        tbody.append(row);
    });
    updatePaginationControls(totalRecords, totalPages);
}
function updatePaginationControls(totalRecords, totalPages) {
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
    $('#currentPageInfo').text(`${startRecord}-${endRecord}`);
    $('#totalRecords').text(totalRecords);
    const paginationControls = $('#paginationControls');
    paginationControls.find('.page-number').remove();
    const prevButton = $('#prevPage');
    if (currentPage <= 1) {
        prevButton.addClass('disabled');
    } else {
        prevButton.removeClass('disabled');
    }
    const nextButton = $('#nextPage');
    if (currentPage >= totalPages) {
        nextButton.addClass('disabled');
    } else {
        nextButton.removeClass('disabled');
    }
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`
            <li class="page-item page-number ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `);
        nextButton.before(pageItem);
    }
}
function initializePagination() {
    $(document).on('click', '#prevPage a', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            populateBookingTable();
        }
    });
    $(document).on('click', '#nextPage a', function(e) {
        e.preventDefault();
        const totalPages = Math.ceil(filteredBookings.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            populateBookingTable();
        }
    });
    $(document).on('click', '.page-number a', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (page !== currentPage) {
            currentPage = page;
            populateBookingTable();
        }
    });
}
function getStatusBadge(status) {
    const labels = {
        completed: 'Completed',
        confirmed: 'Confirmed',
        pending: 'Pending',
        cancelled: 'Cancelled',
        closed: 'Closed'
    };
    const text = labels[status] || status;
    return `<span class="badge" style="background-color: ${brandColors.primary}; color: #ffffff;">${text}</span>`;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('PDF library is not loaded. Please refresh the page and try again.');
            return;
        }
        const doc = new jsPDF();
        doc.setProperties({
            title: 'BW Stays - Booking Report',
            subject: 'Booking Analytics Report',
            author: 'Black and White Stays',
            keywords: 'booking, report, analytics, bwstays',
            creator: 'BW Stays Booking System'
        });
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Black and White Stays', 20, 20);
        doc.setFontSize(16);
        doc.text('Booking Report', 20, 30);
        doc.setFontSize(10);
        const year = $('#yearSelect').val() || 'All Years';
        const month = $('#monthSelect option:selected').text() || 'All Months';
        const property = $('#propertySelect option:selected').text() || 'All Properties';
        const status = $('#statusSelect option:selected').text() || 'All Status';
        doc.text(`Filters: Year: ${year}, Month: ${month}, Property: ${property}, Status: ${status}`, 20, 40);
        const totalBookings = filteredBookings.length;
        const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
        const hasAmounts = filteredBookings.some(booking => booking.amount != null);
        const hasGuests = filteredBookings.some(booking => booking.guests != null);
        const totalGuests = filteredBookings.reduce((sum, booking) => sum + (booking.guests || 0), 0);
        const bookedNights = filteredBookings.filter(booking => booking.status !== 'closed').reduce((sum, booking) => sum + bwNights(booking), 0);
        doc.setFontSize(12);
        doc.text('Summary:', 20, 55);
        doc.setFontSize(10);
        doc.text(`Calendar entries: ${totalBookings}`, 20, 65);
        doc.text(`Booked nights: ${bookedNights}`, 20, 72);
        doc.text(`Total Revenue: ${hasAmounts ? '₹' + totalRevenue.toLocaleString() : 'not recorded'}`, 20, 79);
        doc.text(`Total Guests: ${hasGuests ? totalGuests : 'not recorded'}`, 20, 86);
        const tableData = filteredBookings.map(booking => {
            const propertyName = (propertyConfig[booking.propertyId] || {}).name || booking.propertyName;
            return [
                booking.bookingId,
                propertyName,
                bwText(booking.guestName),
                formatDate(booking.checkIn),
                formatDate(booking.checkOut),
                bwNum(booking.guests),
                booking.status,
                bwMoney(booking.amount)
            ];
        });
        if (typeof doc.autoTable !== 'function') {
            alert('PDF table plugin is not loaded. Please refresh the page and try again.');
            return;
        }
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
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
            doc.text('Black and White Stays - Booking Report', doc.internal.pageSize.width / 2 - 40, doc.internal.pageSize.height - 10);
        }
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `bwBookingReport_${currentDate}.pdf`;
        doc.save(filename);
    } catch (error) {
        alert('An error occurred while generating the PDF. Please check the console for details.');
    }
}
function getSampleBookingData() {
    return [];
}
