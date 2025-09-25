document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let bookingData = [];
    
    // Load booking data
    loadBookingData();
    
    // Set up event listeners
    document.getElementById('generateReport').addEventListener('click', generateReport);
    document.getElementById('exportReport').addEventListener('click', exportReport);
    
    // Filter change listeners
    document.getElementById('yearSelect').addEventListener('change', updateFilters);
    document.getElementById('monthSelect').addEventListener('change', updateFilters);
    document.getElementById('propertySelect').addEventListener('change', updateFilters);
    document.getElementById('statusSelect').addEventListener('change', updateFilters);
    
    // Function to load booking data from JSON file
    function loadBookingData() {
        fetch('./data/booking-reports.json')
            .then(response => response.json())
            .then(data => {
                bookingData = data;
                generateReport(); // Generate initial report
            })
            .catch(error => {
                console.error('Error loading booking data:', error);
                // Use sample data if fetch fails
                bookingData = getSampleData();
                generateReport();
            });
    }
    
    // Function to generate report based on filters
    function generateReport() {
        // Get filter values
        const yearFilter = document.getElementById('yearSelect').value;
        const monthFilter = document.getElementById('monthSelect').value;
        const propertyFilter = document.getElementById('propertySelect').value;
        const statusFilter = document.getElementById('statusSelect').value;
        
        // Filter data
        let filteredData = bookingData.filter(booking => {
            const bookingDate = new Date(booking.checkInDate);
            const bookingYear = bookingDate.getFullYear().toString();
            const bookingMonth = (bookingDate.getMonth() + 1).toString();
            
            return (yearFilter === '' || bookingYear === yearFilter) &&
                   (monthFilter === '' || bookingMonth === monthFilter) &&
                   (propertyFilter === '' || booking.property === propertyFilter) &&
                   (statusFilter === '' || booking.status === statusFilter);
        });
        
        // Update summary cards
        updateSummaryCards(filteredData);
        
        // Update charts
        updateCharts(filteredData);
        
        // Update booking table
        updateBookingTable(filteredData);
    }
    
    // Function to update summary cards
    function updateSummaryCards(data) {
        // Calculate totals
        const totalBookings = data.length;
        const totalRevenue = data.reduce((sum, booking) => sum + booking.amount, 0);
        const totalGuests = data.reduce((sum, booking) => sum + booking.guests, 0);
        const completedBookings = data.filter(booking => booking.status === 'completed').length;
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0;
        
        // Update DOM
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toLocaleString();
        document.getElementById('totalGuests').textContent = totalGuests;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }
    
    // Function to update charts
    function updateCharts(data) {
        // This would be implemented with a charting library like Chart.js
        console.log('Chart data updated with', data.length, 'records');
    }
    
    // Function to update booking table
    function updateBookingTable(data) {
        const tableBody = document.getElementById('bookingTableBody');
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">No bookings found matching the selected filters</td>';
            tableBody.appendChild(row);
            return;
        }
        
        // Sort data by check-in date (newest first)
        data.sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate));
        
        // Add rows to table
        data.forEach(booking => {
            const row = document.createElement('tr');
            row.className = 'booking-details-row';
            row.innerHTML = `
                <td>${booking.bookingId}</td>
                <td>${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}</td>
                <td>${booking.guestName}</td>
                <td>${booking.property}</td>
                <td>${booking.guests}</td>
                <td>₹${booking.amount.toLocaleString()}</td>
                <td><span class="badge badge-${getStatusBadgeClass(booking.status)}">${booking.status}</span></td>
            `;
            tableBody.appendChild(row);
            
            // Add click event to show booking details
            row.addEventListener('click', () => showBookingDetails(booking));
        });
    }
    
    // Function to show booking details
    function showBookingDetails(booking) {
        // This would show a modal with booking details
        console.log('Show details for booking:', booking);
    }
    
    // Function to export report as PDF
    function exportReport() {
        // This would be implemented with a PDF generation library
        alert('PDF export functionality would be implemented here');
    }
    
    // Helper function to update filters
    function updateFilters() {
        generateReport();
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    }
    
    // Helper function to get badge class based on status
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'completed': return 'success';
            case 'confirmed': return 'primary';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }
    
    // Function to get sample data if JSON fetch fails
    function getSampleData() {
        return [
            {
                bookingId: 'BW2024001',
                checkInDate: '2024-07-15',
                checkOutDate: '2024-07-17',
                guestName: 'Rahul Sharma',
                property: 'villa1',
                guests: 4,
                amount: 12000,
                status: 'completed'
            },
            {
                bookingId: 'BW2024002',
                checkInDate: '2024-08-10',
                checkOutDate: '2024-08-12',
                guestName: 'Priya Patel',
                property: 'villa2',
                guests: 6,
                amount: 15000,
                status: 'confirmed'
            },
            {
                bookingId: 'BW2024003',
                checkInDate: '2024-08-20',
                checkOutDate: '2024-08-22',
                guestName: 'Amit Kumar',
                property: 'budget',
                guests: 2,
                amount: 6000,
                status: 'pending'
            },
            {
                bookingId: 'BW2024004',
                checkInDate: '2024-09-05',
                checkOutDate: '2024-09-07',
                guestName: 'Sneha Gupta',
                property: 'villa1',
                guests: 5,
                amount: 13500,
                status: 'confirmed'
            }
        ];
    }
});