const apiSelect = document.getElementById('apiSelect');
const categorySelect = document.getElementById('categorySelect');
let allServices = [];
let currentPage = 1;
let itemsPerPage = 20;  // Giá trị mặc định là 20

// Lắng nghe sự kiện thay đổi của phần select cho số mục mỗi trang
const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    displayServicesForPage(currentPage);
    updatePagination();
});

// Lấy đối tượng select và theo dõi sự kiện thay đổi
apiSelect.addEventListener('change', function() {
    const selectedOption = apiSelect.options[apiSelect.selectedIndex];
    const apiUrl = selectedOption.value;
    const apiKey = selectedOption.getAttribute('data-api-key');
    const tigia = selectedOption.getAttribute('data-tigia');
    const url = `/api/v1/get/services?domain=${encodeURIComponent(apiUrl)}&key=${encodeURIComponent(apiKey)}`;

    if (apiUrl) {
        const data = new URLSearchParams();
        data.append('key', apiKey);
        data.append('action', 'services');

        fetch(url, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            allServices = data;
            const tableBody = document.querySelector('#serviceTable tbody');
            tableBody.innerHTML = '';
            // Lấy các category duy nhất và sắp xếp
            const categories = [...new Set(data.map(service => service.category))];
            categories.sort();
            categorySelect.innerHTML = '<option value="">-- Chọn Category --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            categorySelect.disabled = false;

            // Hiển thị dịch vụ cho trang hiện tại
            displayServicesForPage(currentPage);

            // Cập nhật phân trang
            updatePagination();
        })
        .catch(error => {
            console.error('Lỗi:', error);
        });
    } else {
        const tableBody = document.querySelector('#serviceTable tbody');
        tableBody.innerHTML = '';
        categorySelect.innerHTML = '<option value="">-- Chọn Category --</option>';
        categorySelect.disabled = true;
    }
});

// Lọc dịch vụ theo category đã chọn
categorySelect.addEventListener('change', function() {
    const selectedCategory = categorySelect.value;
    const filteredServices = selectedCategory ? allServices.filter(service => service.category === selectedCategory) : allServices;

    // Hiển thị dịch vụ sau khi lọc
    displayServicesForPage(currentPage, filteredServices);
    updatePagination(filteredServices);
});

// Hiển thị dịch vụ cho một trang
function displayServicesForPage(page, services = allServices) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const servicesToDisplay = services.slice(startIndex, endIndex);
    const tableBody = document.querySelector('#serviceTable tbody');
    tableBody.innerHTML = ''; // Xóa bảng cũ trước khi thêm bảng mới

    // Nhóm dịch vụ theo category
    const groupedServices = groupByCategory(servicesToDisplay);

    // Kiểm tra và đảm bảo có dịch vụ để hiển thị
    if (Object.keys(groupedServices).length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="text-center">Không có dịch vụ nào để hiển thị</td>`;
        tableBody.appendChild(row);
        return;
    }

    // Duyệt qua các nhóm dịch vụ và hiển thị trong bảng
    for (const category in groupedServices) {
        const group = groupedServices[category];
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="text-center">
                <input class="form-check-input checkbox" type="checkbox" name="checked_ids[]" value="${category}">
            </td>
            <td>${category}</td> 
            <td>
                ${group.map(service => `<span>${service.service} </span>`).join('')}
            </td>
        `;
        tableBody.appendChild(row);
    }

    // Gán sự kiện change cho các checkbox mới thêm vào
    attachCheckboxEvent();
}

// Hàm nhóm các dịch vụ theo category
function groupByCategory(services) {
    return services.reduce((groups, service) => {
        const category = service.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(service);
        return groups;
    }, {});
}


// Gán sự kiện change cho các checkbox
function attachCheckboxEvent() {
    $("input[name='checked_ids[]']").on('change', function() {
        updateProviderServer(); // Cập nhật giá trị khi checkbox thay đổi
    });
}

// Cập nhật giá trị của input#providerServer
function updateProviderServer() {
    const checkedIds = [];
    $("input[name='checked_ids[]']:checked").each(function() {
        checkedIds.push($(this).val()); // Thêm giá trị của từng checkbox vào mảng
    });
    $("#name").val(checkedIds.join("\n")); // Cập nhật giá trị vào input#providerServer, cách nhau bằng dấu cách
}

// Cập nhật phân trang
function updatePagination(services = allServices) {
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';  // Xóa các nút phân trang cũ

    // Nút "Trang trước"
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '«';
        prevButton.onclick = function() {
            currentPage--;
            displayServicesForPage(currentPage, services);
            updatePagination(services);
        };
        paginationControls.appendChild(prevButton);
    }

    // Hiển thị nút trang số 1
    const firstPageButton = document.createElement('button');
    firstPageButton.textContent = '1';
    if (currentPage === 1) {
        firstPageButton.disabled = true;  // Vô hiệu hóa nút trang hiện tại
    }
    firstPageButton.onclick = function() {
        currentPage = 1;
        displayServicesForPage(currentPage, services);
        updatePagination(services);
    };
    paginationControls.appendChild(firstPageButton);

    // Các trang còn lại
    let startPage = Math.max(2, currentPage - 4);
    let endPage = Math.min(totalPages - 1, currentPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.disabled = true;
        }
        pageButton.onclick = function() {
            currentPage = i;
            displayServicesForPage(currentPage, services);
            updatePagination(services);
        };
        paginationControls.appendChild(pageButton);
    }

    // Nút "Trang sau"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '»';
        nextButton.onclick = function() {
            currentPage++;
            displayServicesForPage(currentPage, services);
            updatePagination(services);
        };
        paginationControls.appendChild(nextButton);
    }
}
