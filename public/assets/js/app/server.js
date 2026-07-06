document.getElementById('fetchPrice').addEventListener('click', function(event) {
    event.preventDefault();
    const loadingSwal = Swal.fire({
        title: 'ang ng b dch v...',
        text: 'Vui lng i...',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); 
        }
    });
    $.ajax({
        url: '/api/v1/price/smm',
        type: 'GET',
        success: function(response) {
            loadingSwal.close();
            const message = response.message;
            Swal.fire({
                title: 'Thnh cng',
                text: message,
                icon: 'success',
                confirmButtonText: 'Xc nhn'
            }).then(() => {
                location.reload();
            });
        },
        error: function(xhr, status, error) {
            loadingSwal.close();
            Swal.fire({
                title: 'Li',
                text: 'Khng th ly d liu t API. Vui lng th li sau.',
                icon: 'error',
                confirmButtonText: 'Xc nhn'
            }).then(() => {
                location.reload();
            });
        }
    });
});
document.getElementById('syncDetails').addEventListener('click', function(event) {
    event.preventDefault();
    const loadingSwal = Swal.fire({
        title: 'ang ng b cu hnh...',
        text: 'Vui lng i...',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); 
        }
    });
    $.ajax({
        url: '/api/v1/sync/service-details',
        type: 'GET',
        success: function(response) {
            loadingSwal.close();
            Swal.fire({
                title: 'Thnh cng',
                text: response.message,
                icon: 'success',
                confirmButtonText: 'Xc nhn'
            }).then(() => {
                location.reload();
            });
        },
        error: function(xhr, status, error) {
            loadingSwal.close();
            Swal.fire({
                title: 'Li',
                text: 'Khng th ng b cu hnh. Vui lng th li sau.',
                icon: 'error',
                confirmButtonText: 'Xc nhn'
            }).then(() => {
                location.reload();
            });
        }
    });
});


const apiSelect = document.getElementById('apiSelect');
const categorySelect = document.getElementById('categorySelect');
let allServices = [];
let currentPage = 1;
let itemsPerPage = 20; 

const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);  
    const selectedCategory = categorySelect.value;  
    const filteredServices = selectedCategory ? allServices.filter(service => service.category === selectedCategory) : allServices;
    displayServicesForPage(currentPage, filteredServices);
    
    updatePagination(filteredServices);
});


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

        const tableBody = document.querySelector('#serviceTable tbody');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> ang ti danh sch...</td></tr>';

        fetch(url, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) throw new Error('Mng khng n nh hoc li server (HTTP ' + response.status + ')');
            return response.json();
        })
        .then(data => {
            // Kim tra xem data c phi l mng khng (Mt s API li tr v object {error: ...})
            if (!Array.isArray(data)) {
                let errorMsg = 'D liu khng hp l t API';
                if (data && typeof data === 'object' && data.error) errorMsg = data.error;
                throw new Error(errorMsg);
            }

            allServices = data;
            if (tableBody) tableBody.innerHTML = '';

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
            console.error('Li SMM API:', error);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Li: ${error.message}</td></tr>`;
            categorySelect.innerHTML = '<option value="">-- Li ti danh mc --</option>';
            categorySelect.disabled = true;
            if (typeof Swal !== 'undefined' && Swal.fire) {
                Swal.fire('Tht bi', 'Khng th ly danh sch dch v: ' + error.message, 'error');
            }
        });
    } else {
        const tableBody = document.querySelector('#serviceTable tbody');
        if (tableBody) tableBody.innerHTML = '';
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
            <td style="white-space: normal; min-width: 250px;">
                <div class="small text-muted" style="max-height: 100px; overflow-y: auto;">
                    ${service.description || service.desc || '<i>Khng c m t</i>'}
                </div>
            </td>
            <td>
                <ul>
                    <li>
                        <strong class="text-success">Gi: </strong>
                        ${(() => {
                            const tigiaAttr = (apiSelect && apiSelect.selectedOptions && apiSelect.selectedOptions[0]) 
                                ? apiSelect.selectedOptions[0].getAttribute('data-tigia') 
                                : 1;
                            const tigia = parseFloat(tigiaAttr) || 1;
                            const rate = parseFloat(service.rate) || 0;
                            return (rate * tigia / 1000).toFixed(4);
                        })()}
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
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-primary-gradient btn-add-single" data-id="${service.service}">
                    <i class="fas fa-plus"></i> Thm
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Gn s kin change cho cc checkbox mi thm vo
    attachCheckboxEvent();

    // Gn s kin click cho nt Thm ring l
    document.querySelectorAll('.btn-add-single').forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-id');
            addSingleService(serviceId, this);
        });
    });
}

function addSingleService(serviceId, buttonElement) {
    const form = $('#createServerV2');
    const originalText = buttonElement.innerHTML;
    
    // Prepare data - we only want this specific ID
    const formData = form.serializeArray();
    // Remove any existing checked_ids[] from serialized data
    const filteredData = formData.filter(item => item.name !== 'checked_ids[]' && item.name !== 'checked_all');
    // Add our single ID
    filteredData.push({ name: 'checked_ids[]', value: serviceId });

    $(buttonElement).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');

    $.ajax({
        url: form.attr('action'),
        method: form.attr('method'),
        data: $.param(filteredData),
        success: function (response) {
            $(buttonElement).prop('disabled', false).html('<i class="fas fa-check"></i> Xong');
            $(buttonElement).removeClass('btn-primary-gradient').addClass('btn-success');
            
            Swal.fire({
                title: 'Thnh cng!',
                text: response.message,
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3000,
                showConfirmButton: false
            });
        },
        error: function (xhr) {
            $(buttonElement).prop('disabled', false).html(originalText);
            Swal.fire({
                title: 'Li!',
                text: xhr.responseJSON?.message || ' xy ra li!',
                icon: 'error'
            });
        }
    });
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

    const firstPageButton = document.createElement('button');
    firstPageButton.textContent = '1';
    if (currentPage === 1) {
        firstPageButton.disabled = true;  
    }
    firstPageButton.onclick = function() {
        currentPage = 1;
        displayServicesForPage(currentPage, services);
        updatePagination(services);
    };
    paginationControls.appendChild(firstPageButton);

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

$('#createServerV2').on('submit', function (e) {
    e.preventDefault();

    const form = $(this);
    const providerServer = $('#providerServer').val().trim(); 
    const submitButton = $('button[type="submit"]');
    const originalButtonText = submitButton.html();
    if (!providerServer) {
        Swal.fire({
            title: 'Li!',
            text: 'Vui lng nhp y  thng tin.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        return; 
    }

    submitButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> ang x l...');

    $.ajax({
        url: form.attr('action'),
        method: form.attr('method'),
        data: form.serialize(),
        success: function (response) {
            submitButton.prop('disabled', false).html(originalButtonText);

            Swal.fire({
                title: 'Thnh cng!',
                text: response.message,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Chn tip',
                cancelButtonText: 'ng',
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    $('#checked_all').prop('checked', false); 
                    $('#providerServer').val('');
                    $('input[name="checked_ids[]"]').prop('checked', false);
                    Swal.close();
                } else {
                    location.reload();
                }
            });
        },
        error: function (xhr) {
            submitButton.prop('disabled', false).html(originalButtonText);

            Swal.fire({
                title: 'Li!',
                text: xhr.responseJSON?.message || ' xy ra li, vui lng th li!',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    });
});

