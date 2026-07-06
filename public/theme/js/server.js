const apiSelect = document.getElementById('apiSelect');
const categorySelect = document.getElementById('categorySelect');
let allServices = [];
let currentPage = 1;
let itemsPerPage = 20;  // Gi tr mc nh l 20

// Lng nghe s kin thay i ca phn select cho s mc mi trang
const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    displayServicesForPage(currentPage);
    updatePagination();
});

// Ly i tng select v theo di s kin thay i
apiSelect.addEventListener('change', function() {
    const selectedOption = apiSelect.options[apiSelect.selectedIndex];
    const apiUrl = selectedOption.value;
    const apiKey = selectedOption.getAttribute('data-api-key');
    const tigia = selectedOption.getAttribute('data-tigia');

    if (apiUrl) {
        const data = new URLSearchParams();
        data.append('key', apiKey);
        data.append('action', 'services');

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        })
        .then(response => response.json())
        .then(data => {
            allServices = data;
            const tableBody = document.querySelector('#serviceTable tbody');
            tableBody.innerHTML = '';
            // Ly cc category duy nht v sp xp
            const categories = [...new Set(data.map(service => service.category))];
            categories.sort();
            categorySelect.innerHTML = '<option value="">-- Chn Category --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            categorySelect.disabled = false;

            // Hin th dch v cho trang hin ti
            displayServicesForPage(currentPage);

            // Cp nht phn trang
            updatePagination();
        })
        .catch(error => {
            console.error('Li:', error);
        });
    } else {
        const tableBody = document.querySelector('#serviceTable tbody');
        tableBody.innerHTML = '';
        categorySelect.innerHTML = '<option value="">-- Chn Category --</option>';
        categorySelect.disabled = true;
    }
});

// Lc dch v theo category  chn
categorySelect.addEventListener('change', function() {
    const selectedCategory = categorySelect.value;
    const filteredServices = selectedCategory ? allServices.filter(service => service.category === selectedCategory) : allServices;

    // Hin th dch v sau khi lc
    displayServicesForPage(currentPage, filteredServices);
    // Cp nht phn trang cho danh sch  lc
    updatePagination(filteredServices);
});

// Hin th dch v cho mt trang
function displayServicesForPage(page, services = allServices) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const servicesToDisplay = services.slice(startIndex, endIndex);
    const tableBody = document.querySelector('#serviceTable tbody');
    tableBody.innerHTML = '';  // Xa bng c trc khi thm bng mi

    servicesToDisplay.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">
                <input class="form-check-input checkbox" type="checkbox" name="checked_ids[]" value="${service.service}" class="service-checkbox">
            </td>
            <td>${service.service}</td>
            <td>
                <ul>
                    <li>Tn: ${service.name}</li>
                    <li>Danh mc: ${service.category}</li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>
                        <strong class="text-success">Gi: </strong>
                        ${(parseFloat(service.rate) * parseFloat(apiSelect.selectedOptions[0].getAttribute('data-tigia'))  / 1000).toFixed(4)}
                    </li>
                    <li>
                        <strong class="text-primary">Min: </strong>
                        ${service.min}
                    </li>
                    <li>
                        <strong class="text-info">Max: </strong>
                        ${service.max}
                    </li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>Loi: ${service.type}</li>
                    <li>REFILL: ${service.refill ? 'C' : 'Khng'}</li>
                </ul>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Gn s kin change cho cc checkbox mi thm vo
    attachCheckboxEvent();
}

// Gn s kin change cho cc checkbox
function attachCheckboxEvent() {
    $("input[name='checked_ids[]']").on('change', function() {
        updateProviderServer(); // Cp nht gi tr khi checkbox thay i
    });
}

// Cp nht gi tr ca input#providerServer
function updateProviderServer() {
    const checkedIds = [];
    $("input[name='checked_ids[]']:checked").each(function() {
        checkedIds.push($(this).val()); // Thm gi tr ca tng checkbox vo mng
    });
    $("#providerServer").val(checkedIds.join(" ")); // Cp nht gi tr vo input#providerServer, cch nhau bng du cch
}

// Cp nht phn trang
function updatePagination(services = allServices) {
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';  // Xa cc nt phn trang c

    // Nt "Trang trc"
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '';
        prevButton.onclick = function() {
            currentPage--;
            displayServicesForPage(currentPage, services);
            updatePagination(services);
        };
        paginationControls.appendChild(prevButton);
    }

    // Hin th nt trang s 1
    const firstPageButton = document.createElement('button');
    firstPageButton.textContent = '1';
    if (currentPage === 1) {
        firstPageButton.disabled = true;  // V hiu ha nt trang hin ti
    }
    firstPageButton.onclick = function() {
        currentPage = 1;
        displayServicesForPage(currentPage, services);
        updatePagination(services);
    };
    paginationControls.appendChild(firstPageButton);

    // Cc trang cn li
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

    // Nt "Trang sau"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '';
        nextButton.onclick = function() {
            currentPage++;
            displayServicesForPage(currentPage, services);
            updatePagination(services);
        };
        paginationControls.appendChild(nextButton);
    }
}
