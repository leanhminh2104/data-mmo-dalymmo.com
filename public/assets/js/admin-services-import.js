/**
 * Admin – Nhập dịch vụ từ API
 * Cần: #importFromApiPage (data-fetch-url, data-process-url, data-index-url), #import-provider-config, #import-platform-config
 */
(function () {
    'use strict';

    var pageEl = document.getElementById('importFromApiPage');
    if (!pageEl || typeof jQuery === 'undefined') return;

    var routes = {
        fetchUrl: pageEl.getAttribute('data-fetch-url') || '',
        processUrl: pageEl.getAttribute('data-process-url') || '',
        indexUrl: pageEl.getAttribute('data-index-url') || ''
    };

    var $ = jQuery;
    var categoriesData = [];
    window.__importAiBasePayload = window.__importAiBasePayload || {};
    var aiBtn = '<button type="button" data-no-loader="true" class="btn btn-sm btn-link p-0 ai-btn-import" title="Tối ưu nội dung bằng AI" style="margin-top: 2px;"><iconify-icon icon="solar:magic-stick-3-bold" class="text-primary" style="font-size: 18px;"></iconify-icon></button>';


    function forceCloseGlobalLoader() {
        if (typeof window.forceHideGlobalLoader === 'function') {
            window.forceHideGlobalLoader();
            return;
        }
        if (typeof window.hideGlobalLoader === 'function') {
            window.hideGlobalLoader();
        }
    }

    function closeAnyLoadingUi() {
        forceCloseGlobalLoader();
        if (window.Swal && typeof window.Swal.close === 'function') {
            window.Swal.close();
        }
    }

    function showHamsterLoadingPopup(title, text) {
        if (typeof Swal === 'undefined') {
            return;
        }
        var hamsterHtml = (window.getHamsterLoaderHtml && window.getHamsterLoaderHtml())
            ? window.getHamsterLoaderHtml()
            : '<i class="fas fa-circle-notch fa-spin" style="font-size:28px;"></i>';

        Swal.fire({
            title: title || 'Đang xử lý...',
            html: '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:8px;">'
                + '<div style="font-size:11px;line-height:1;">' + hamsterHtml + '</div>'
                + '<div style="font-size:14px;color:#6b7280;">' + (text || 'Vui lòng chờ trong giây lát...') + '</div>'
                + '</div>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
        });
    }

    function escapeHtml(text) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    function updateMobileCount() {
        var isMobile = window.matchMedia('(max-width: 767.98px)').matches;
        var suffix = isMobile ? '_card' : '_table';
        var count = $('.service-checkbox[id$="' + suffix + '"]:checked').length;
        $('#mobileCount').text(count);
    }
    window.updateMobileCount = updateMobileCount;

    function updateCategoryCheckbox(categoryIndex) {
        var serviceCheckboxes = $('.category_' + categoryIndex + '_service');
        var checkedCount = serviceCheckboxes.filter(':checked').length;
        var categoryCheckbox = $('#category_' + categoryIndex);
        if (checkedCount === 0) {
            categoryCheckbox.prop('checked', false).prop('indeterminate', false);
        } else if (checkedCount === serviceCheckboxes.length) {
            categoryCheckbox.prop('checked', true).prop('indeterminate', false);
        } else {
            categoryCheckbox.prop('checked', false).prop('indeterminate', true);
        }
    }

    window.selectAllCategories = function () {
        $('.category-checkbox').prop('checked', true).trigger('change');
        updateMobileCount();
    };

    window.deselectAllCategories = function () {
        $('.category-checkbox').prop('checked', false);
        $('.service-checkbox').prop('checked', false);
        $('.import-service-card').removeClass('selected');
    };

    window.toggleCardCheck = function (categoryIndex, serviceIndex) {
        var cb = $('#service_' + categoryIndex + '_' + serviceIndex + '_card');
        cb.prop('checked', !cb.is(':checked')).trigger('change');
    };

    window.toggleCategoryServices = function (categoryIndex) {
        var isChecked = $('#category_' + categoryIndex).is(':checked');
        window.toggleCategoryServiceCheckboxes(categoryIndex, isChecked);
        $('.category_' + categoryIndex + '_service').each(function () {
            var id = $(this).attr('id');
            if (id && id.endsWith('_card')) {
                var serviceIdx = id.split('_')[2];
                $('#card_' + categoryIndex + '_' + serviceIdx).toggleClass('selected', isChecked);
            }
        });
    };

    window.toggleCategoryServiceCheckboxes = function (categoryIndex, checked) {
        $('.category_' + categoryIndex + '_service').prop('checked', checked);
        updateCategoryCheckbox(categoryIndex);
        updateMobileCount();
    };

    window.syncSelection = function (categoryIndex, serviceIndex, source) {
        var isChecked = $('#service_' + categoryIndex + '_' + serviceIndex + '_' + source).is(':checked');
        var other = source === 'card' ? 'table' : 'card';
        if ($('#service_' + categoryIndex + '_' + serviceIndex + '_' + other).length) {
            $('#service_' + categoryIndex + '_' + serviceIndex + '_' + other).prop('checked', isChecked);
        }
        $('#card_' + categoryIndex + '_' + serviceIndex).toggleClass('selected', isChecked);
        updateCategoryCheckbox(categoryIndex);
        updateMobileCount();
    };

    function collectFormData() {
        var formData = new FormData();
        formData.append('provider_id', $('#import_provider_id').val());
        formData.append('platform_id', $('#import_platform_id').val());
        formData.append('_token', $('meta[name="csrf-token"]').attr('content'));
        $('.import-category-group').each(function () {
            var categoryIndex = $(this).data('category-index');
            var $catCb = $('#category_' + categoryIndex);
            if ($catCb.is(':checked') || $catCb.prop('indeterminate')) {
                formData.append('categories[]', $('#category_api_name_' + categoryIndex).val());
                formData.append('category_names[]', $('#category_name_' + categoryIndex).val());
                formData.append('category_api_names[]', $('#category_api_name_' + categoryIndex).val());
                var isMobile = window.matchMedia('(max-width: 767.98px)').matches;
                var suffix = isMobile ? '_card' : '_table';
                $(this).find('.service-checkbox[id$="' + suffix + '"]:checked').each(function () {
                    var idParts = $(this).attr('id').split('_');
                    var serviceIdx = idParts[2];
                    var serviceName = $('#service_name_' + categoryIndex + '_' + serviceIdx).val();
                    var serviceApiName = $('#service_api_name_' + categoryIndex + '_' + serviceIdx).val();
                    try {
                        var raw = $(this).val();
                        if (typeof raw !== 'string') raw = '';
                        var val = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
                        val.name = serviceName;
                        val.api_name = serviceApiName;
                        val.category = $('#category_api_name_' + categoryIndex).val();
                        formData.append('services[]', JSON.stringify(val));
                        formData.append('service_names[]', serviceName);
                        formData.append('service_api_names[]', serviceApiName);
                    } catch (e) { }
                });
            }
        });
        return formData;
    }
    window.displayServices = function (categories) {
        var container = $('#categoriesContainer');
        container.empty();
        if (!Array.isArray(categories) || categories.length === 0) {
            container.html('<div class="alert alert-warning border-dashed">Không tìm thấy dịch vụ nào phù hợp với nền tảng đã chọn hoặc do lỗi dữ liệu API.</div>');
            return;
        }
        var isMobile = window.matchMedia('(max-width: 767.98px)').matches;
        if (isMobile && $('#mobileActionBar').length === 0) {
            $('body').addClass('pb-5').append(
                '<div id="mobileActionBar" class="fixed-bottom bg-white border-top p-3 d-flex align-items-center justify-content-between shadow-lg" style="z-index: 1040;">' +
                '<div class="fw-bold text-primary">Đã chọn: <span id="mobileCount">0</span></div>' +
                '<div class="d-flex gap-2">' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectAllCategories()">Tất cả</button>' +
                '<button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById(\'importForm\').requestSubmit()">Import</button>' +
                '</div></div>'
            );
        }
        var categoryIndex = 0;
        var totalCategories = categories.length;
        window.__importServiceDescs = window.__importServiceDescs || {};

        var $tempContainer = $('<div style="display:none"></div>');

        function renderNext() {
            if (categoryIndex >= totalCategories) {
                console.log('admin-services-import: Rendering finished.');
                container.append($tempContainer.contents());
                $('#loadingState').hide();
                return;
            }
            
            var batchSize = isMobile ? 1 : 10;
            for (var b = 0; b < batchSize && categoryIndex < totalCategories; b++) {
                var cat = categories[categoryIndex];
                if (!cat || !cat.services) {
                    categoryIndex++;
                    continue;
                }
                
                var headHtml = '<div class="card-header bg-light-subtle py-3 border-bottom d-flex align-items-center gap-2">' +
                    '<input class="form-check-input category-checkbox" type="checkbox" id="category_' + categoryIndex + '" onchange="toggleCategoryServices(' + categoryIndex + ')">' +
                    '<label class="form-check-label fw-bold mb-0 flex-grow-1" for="category_' + categoryIndex + '">' +
                    '<span class="editable-category-name cursor-pointer h6 mb-0" onclick="editCategoryName(' + categoryIndex + ')" title="Click để sửa">' + escapeHtml(cat.name) + '</span>' +
                    '<span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-2 rounded-pill">' + cat.services.length + ' dịch vụ</span></label>' +
                    '<input type="hidden" id="category_name_' + categoryIndex + '" value="' + escapeHtml(cat.name) + '">' +
                    '<input type="hidden" id="category_api_name_' + categoryIndex + '" value="' + escapeHtml(cat.name) + '"></div>';
                
                var tableHtml = '<div class="table-responsive d-none d-md-block"><table class="table table-hover table-striped align-middle mb-0">' +
                    '<thead class="table-light"><tr><th style="width:50px" class="text-center"><input type="checkbox" class="form-check-input" onchange="toggleCategoryServiceCheckboxes(' + categoryIndex + ', this.checked)"></th><th style="width:80px" class="text-center">ID</th><th>Tên dịch vụ</th><th class="text-end" style="width:180px">Giá</th><th class="text-center" style="width:160px">Min/Max</th><th style="width:60px" class="text-center">BH</th><th style="width:60px" class="text-center">Hủy</th></tr></thead>' +
                    '<tbody id="category_' + categoryIndex + '_services_table"></tbody></table></div>';
                
                var cardsHtml = '<div class="d-md-none p-3" id="category_' + categoryIndex + '_services_cards"></div>';
                
                var $catEl = $('<div class="card border border-light-subtle shadow-none mb-4" data-category-index="' + categoryIndex + '">' + headHtml + '<div class="card-body p-0">' + tableHtml + cardsHtml + '</div></div>');
                $tempContainer.append($catEl);
                
                var tbody = $catEl.find('#category_' + categoryIndex + '_services_table');
                var cardContainer = $catEl.find('#category_' + categoryIndex + '_services_cards');
                
                var providerCurrency = window.providerCurrency || 'VND';
                var providerExchangeRate = window.providerExchangeRate || 1;
                var providerPricingType = window.providerPricingType || 'per_1000';
                
                for (var i = 0; i < cat.services.length; i++) {
                    var s = cat.services[i];
                    var rate = parseFloat(s.rate || 0);
                    if (providerPricingType === 'per_1') rate = rate * 1000;
                    var rateVnd = providerCurrency === 'USD' ? (rate * providerExchangeRate) : rate;
                    var rateDisplay = providerCurrency === 'USD' ? ('<span class="text-primary fw-bold">$' + rate.toFixed(2) + '</span> <small class="text-muted">(' + Math.round(rateVnd).toLocaleString('vi-VN') + 'đ)</small>') : '<span class="text-primary fw-bold">' + Math.round(rate).toLocaleString('vi-VN') + 'đ</span>';
                    var rateSimple = providerCurrency === 'USD' ? (Math.round(rateVnd).toLocaleString('vi-VN') + 'đ/1k') : (Math.round(rate).toLocaleString('vi-VN') + 'đ/1k');
                    var serviceDesc = s.desc || s.description || '';
                    if (!window.__importServiceDescs[categoryIndex]) window.__importServiceDescs[categoryIndex] = {};
                    window.__importServiceDescs[categoryIndex][i] = serviceDesc;
                    
                    var serviceData = { service: s.service || '', name: s.name || '', api_name: s.name || '', category: cat.name, desc: serviceDesc };
                    var serviceJsonEscaped = JSON.stringify(serviceData).replace(/"/g, '&quot;').replace(/&/g, '&amp;');
                    var aiBtnHtml = '<button type="button" class="btn btn-icon btn-sm btn-link-primary" onclick="generateAiForImportRow(' + categoryIndex + ',' + i + ')" title="Tối ưu bằng AI"><iconify-icon icon="solar:magic-stick-3-bold" class="fs-5"></iconify-icon></button>';
                    
                    tbody.append(
                        '<tr><td class="text-center"><div class="d-flex align-items-center justify-content-center gap-1"><input type="checkbox" class="form-check-input service-checkbox category_' + categoryIndex + '_service" name="services[]" value="' + serviceJsonEscaped + '" id="service_' + categoryIndex + '_' + i + '_table" onchange="syncSelection(' + categoryIndex + ',' + i + ',\'table\')">' + aiBtnHtml + '</div></td>' +
                        '<td class="text-center"><span class="badge bg-light text-dark border">' + (s.service || s.id || '') + '</span></td>' +
                        '<td>' +
                            '<div class="fw-semibold text-dark cursor-pointer text-wrap" onclick="editServiceName(' + categoryIndex + ',' + i + ')" id="service_name_display_' + categoryIndex + '_' + i + '">' + escapeHtml(s.name || '') + '</div>' +
                            '<div class="mt-1 d-flex align-items-center gap-2">' +
                                '<span class="text-muted small text-truncate d-inline-block" style="max-width:400px" id="service_desc_display_' + categoryIndex + '_' + i + '">' + (serviceDesc ? (escapeHtml(serviceDesc.replace(/<[^>]+>/g, '')).substring(0, 80) + '...') : 'Không có mô tả') + '</span>' +
                                '<button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" onclick="editServiceDesc(' + categoryIndex + ',' + i + ')" style="font-size:11px">Sửa</button>' +
                            '</div>' +
                            '<input type="hidden" id="service_name_' + categoryIndex + '_' + i + '" value="' + escapeHtml(s.name || '') + '">' +
                            '<input type="hidden" id="service_api_name_' + categoryIndex + '_' + i + '" value="' + escapeHtml(s.name || '') + '">' +
                        '</td>' +
                        '<td class="text-end">' + rateDisplay + '</td>' +
                        '<td class="text-center text-muted small">' + (s.min || '0').toLocaleString() + ' / ' + (s.max || '0').toLocaleString() + '</td>' +
                        '<td class="text-center">' + (s.refill ? '<iconify-icon icon="solar:shield-check-bold" class="text-success fs-5"></iconify-icon>' : '<iconify-icon icon="solar:shield-cross-bold" class="text-light fs-5"></iconify-icon>') + '</td>' +
                        '<td class="text-center">' + (s.cancel ? '<iconify-icon icon="solar:close-circle-bold" class="text-danger fs-5"></iconify-icon>' : '<iconify-icon icon="solar:close-circle-linear" class="text-light fs-5"></iconify-icon>') + '</td></tr>'
                    );
                    
                    var cardDescShort = serviceDesc ? (escapeHtml((serviceDesc.replace(/<[^>]+>/g, '')).substring(0, 60)) + (serviceDesc.length > 60 ? '…' : '')) : '';
                    cardContainer.append(
                        '<div class="card border border-light-subtle shadow-none mb-2 p-3" id="card_' + categoryIndex + '_' + i + '">' +
                        '<div class="d-flex align-items-start gap-2 mb-2">' +
                            '<input type="checkbox" class="form-check-input service-checkbox category_' + categoryIndex + '_service" name="services[]" value="' + serviceJsonEscaped + '" id="service_' + categoryIndex + '_' + i + '_card" onchange="syncSelection(' + categoryIndex + ',' + i + ',\'card\')">' + 
                            '<div class="flex-grow-1"><div class="fw-bold small text-dark">' + escapeHtml(s.name || '') + '</div></div>' +
                            aiBtnHtml +
                        '</div>' +
                        '<div class="small text-muted mb-2">' + (cardDescShort || 'Không có mô tả') + '</div>' +
                        '<div class="d-flex justify-content-between align-items-center"><span class="text-primary fw-bold">' + rateSimple + '</span><span class="text-muted smaller">' + (s.min || '0') + ' - ' + (s.max || '0') + '</span></div></div>'
                    );
                }
                categoryIndex++;
            }
            if (categoryIndex % 20 === 0 || categoryIndex >= totalCategories) {
                container.append($tempContainer.contents());
            }
            setTimeout(renderNext, 30);
        }
        renderNext();
    };


    /** Sửa tên danh mục trực tiếp */
    window.editCategoryName = function (categoryIndex) {
        var $target = $('.editable-category-name[data-category-index="' + categoryIndex + '"]');
        if ($target.length === 0) $target = $('#categoriesContainer div[data-category-index="' + categoryIndex + '"] .editable-category-name');
        
        if ($target.siblings('input.inline-edit-input').length) return;
        var currentName = $('#category_name_' + categoryIndex).val();
        var $input = $('<input type="text" class="form-control form-control-sm inline-edit-input" value="' + escapeHtml(currentName) + '" style="max-width:100%">');
        $target.after($input).hide();
        $input.focus().select().on('blur keydown', function (e) {
            if (e.type === 'keydown' && e.which !== 13) return;
            if (e.type === 'keydown') e.preventDefault();
            var newName = $input.val().trim();
            if (newName === '') newName = currentName;
            $target.text(newName).show();
            $('#category_name_' + categoryIndex).val(newName);
            $input.remove();
            if (window.Swal) Swal.fire({ icon: 'success', title: 'Cập nhật thành công', showConfirmButton: false, timer: 1000, position: 'top-end', toast: true });
        });
    };

    /** Sửa tên dịch vụ trực tiếp */
    window.editServiceName = function (categoryIndex, serviceIndex) {
        var $target = $('#service_name_display_' + categoryIndex + '_' + serviceIndex);
        if ($target.siblings('input.inline-edit-input').length) return;
        var currentName = $('#service_name_' + categoryIndex + '_' + serviceIndex).val();
        var $input = $('<input type="text" class="form-control form-control-sm inline-edit-input" value="' + escapeHtml(currentName) + '" style="max-width:100%">');
        $target.after($input).hide();
        $input.focus().select().on('blur keydown', function (e) {
            if (e.type === 'keydown' && e.which !== 13) return;
            if (e.type === 'keydown') e.preventDefault();
            var newName = $input.val().trim();
            if (newName === '') newName = currentName;
            $target.text(newName).show();
            $('#service_name_' + categoryIndex + '_' + serviceIndex).val(newName);
            syncServiceCheckboxValue(categoryIndex, serviceIndex, newName);
            $input.remove();
            if (window.Swal) Swal.fire({ icon: 'success', title: 'Cập nhật thành công', showConfirmButton: false, timer: 1000, position: 'top-end', toast: true });
        });
    };

    function syncServiceCheckboxValue(categoryIndex, serviceIndex, newName) {
        ['_table', '_card'].forEach(function (suffix) {
            var cb = $('#service_' + categoryIndex + '_' + serviceIndex + suffix);
            if (cb.length) {
                try {
                    var raw = cb.val();
                    var val = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
                    val.name = newName;
                    cb.val(JSON.stringify(val).replace(/"/g, '&quot;').replace(/&/g, '&amp;'));
                } catch (e) { }
            }
        });
    }

    /** Mở modal sửa mô tả dịch vụ */
    window.editServiceDesc = function (categoryIndex, serviceIndex) {
        var getCurrentDesc = function () {
            if (window.__importServiceDescs && window.__importServiceDescs[categoryIndex] && window.__importServiceDescs[categoryIndex][serviceIndex] !== undefined) {
                return window.__importServiceDescs[categoryIndex][serviceIndex] || '';
            }
            return '';
        };
        var currentDesc = getCurrentDesc();
        $('#importDescModal').data('categoryIndex', categoryIndex).data('serviceIndex', serviceIndex).data('currentDesc', currentDesc);
        $('#importDescEditor').val(currentDesc);
        
        var modalEl = document.getElementById('importDescModal');
        var bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bootstrapModal.show();

        if (typeof tinymce !== 'undefined') {
            if (tinymce.get('importDescEditor')) {
                tinymce.get('importDescEditor').setContent(currentDesc || '');
            } else {
                tinymce.init({
                    selector: '#importDescEditor',
                    height: 350,
                    menubar: false,
                    plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table wordcount',
                    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link | code',
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; }',
                    branding: false,
                    promotion: false,
                    license_key: 'gpl',
                    setup: function (ed) {
                        ed.on('init', function () { ed.setContent(currentDesc || ''); });
                    }
                });
            }
        }
    };

    window.closeImportDescModal = function () {
        var modalEl = document.getElementById('importDescModal');
        var bootstrapModal = bootstrap.Modal.getInstance(modalEl);
        if (bootstrapModal) bootstrapModal.hide();
    };

    window.saveImportDescModal = function () {
        var html = (typeof tinymce !== 'undefined' && tinymce.get('importDescEditor')) ? tinymce.get('importDescEditor').getContent() : $('#importDescEditor').val();
        var catIdx = $('#importDescModal').data('categoryIndex');
        var srvIdx = $('#importDescModal').data('serviceIndex');
        
        window.updateImportServiceDescription(catIdx, srvIdx, html);
        window.closeImportDescModal();
    };

    $(document).ready(function () {
        $('#fetchForm').attr('data-no-loader', 'true');
        $('#importForm').attr('data-no-loader', 'true');
        $('#fetchForm button[type="submit"]').attr('data-no-loader', 'true');
        $('#importForm button[type="submit"]').attr('data-no-loader', 'true');
        forceCloseGlobalLoader();

        $(document).ajaxStop(function () {
            forceCloseGlobalLoader();
        });

        $('#fetchForm').on('submit', function (e) {
            e.preventDefault();
            var form = $(this);
            var formData = form.serialize();
            var submitBtn = form.find('button[type="submit"]');
            var originalBtnHtml = submitBtn.html();
            $('#loadingState').show();
            $('#servicesList').hide();
            showHamsterLoadingPopup('\u0110ang k\u1ebft n\u1ed1i API...', 'H\u1ec7 th\u1ed1ng \u0111ang l\u1ea5y danh s\u00e1ch d\u1ecbch v\u1ee5.');
            $.ajax({
                url: routes.fetchUrl,
                type: 'POST',
                data: formData,
                headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                beforeSend: function () {
                    submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Đang lấy dữ liệu...').prop('disabled', true);
                },
                success: function (response) {
                    submitBtn.html(originalBtnHtml).prop('disabled', false);
                    if (response.status === 'success') {
                        categoriesData = response.data.categories || [];
                        console.log('admin-services-import: Fetch success, found ' + categoriesData.length + ' categories');
                        window.providerCurrency = response.data.provider_currency || 'VND';
                        window.providerExchangeRate = parseFloat(response.data.provider_exchange_rate) || 1;
                        window.providerPricingType = response.data.provider_pricing_type || 'per_1000';
                        window.displayServices(categoriesData);
                        $('#import_provider_id').val($('#fetchForm input[name="provider_id"]').val());
                        $('#import_platform_id').val($('#fetchForm input[name="platform_id"]').val());
                        $('#servicesList').show();
                        closeAnyLoadingUi();
                        if (window.Swal) Swal.fire({ icon: 'success', title: 'Thành công', text: 'Tìm thấy ' + (response.data.services_count || 0) + ' dịch vụ', timer: 1500, showConfirmButton: false });
                    } else {
                        console.error('admin-services-import: Fetch failed with status success but custom error', response);
                        $('#loadingState').hide();
                        closeAnyLoadingUi();
                        if (window.Swal) Swal.fire('Lỗi', response.message || 'Lấy danh sách thất bại', 'error');
                    }
                },
                error: function (xhr) {
                    submitBtn.html(originalBtnHtml).prop('disabled', false);
                    $('#loadingState').hide();
                    closeAnyLoadingUi();
                    var message = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Đã có lỗi xảy ra';
                    if (window.Swal) Swal.fire('Thất bại', message, 'error');
                }
            });
        });

        $('#importForm').on('submit', function (e) {
            e.preventDefault();
            var form = $(this);
            var selectedServices = form.find('input[name="services[]"]:checked');
            
            var hasSelectedCategory = false;
            $('.category-checkbox').each(function() {
                if ($(this).is(':checked') || $(this).prop('indeterminate')) {
                    hasSelectedCategory = true;
                    return false; // break loop
                }
            });

            if (!hasSelectedCategory) {
                if (window.Swal) Swal.fire('Cảnh báo', 'Vui lòng chọn ít nhất một danh mục', 'warning');
                return;
            }
            if (selectedServices.length === 0) {
                if (window.Swal) Swal.fire('Cảnh báo', 'Vui lòng chọn ít nhất một dịch vụ', 'warning');
                return;
            }

            Swal.fire({
                title: 'Xác nhận import',
                text: "Bạn có chắc muốn import " + selectedServices.length + " dịch vụ đã chọn?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    processImport();
                }
            });

            async function processImport() {
                var submitBtn = form.find('button[type="submit"]');
                var originalBtnHtml = submitBtn.html();
                var allFormData = collectFormData();
                var allServices = allFormData.getAll('services[]');
                var allServiceNames = allFormData.getAll('service_names[]');
                var allServiceApiNames = allFormData.getAll('service_api_names[]');

                var BATCH_SIZE = 30;
                var totalBatches = Math.ceil(allServices.length / BATCH_SIZE);
                var currentBatch = 0;
                var totalImported = 0;

                Swal.fire({
                    title: 'Đang tiến hành import...',
                    html: '<div class="progress mb-2" style="height: 20px;"><div id="importProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%">0%</div></div><div id="importStatusText" class="small text-muted">Đang chuẩn bị...</div>',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => { Swal.showLoading(); }
                });

                for (currentBatch = 0; currentBatch < totalBatches; currentBatch++) {
                    var progress = Math.round((currentBatch / totalBatches) * 100);
                    $('#importProgressBar').css('width', progress + '%').text(progress + '%');
                    $('#importStatusText').text('Đang xử lý lô ' + (currentBatch + 1) + '/' + totalBatches + '...');

                    var startIndex = currentBatch * BATCH_SIZE;
                    var batchServices = allServices.slice(startIndex, startIndex + BATCH_SIZE);
                    var batchNames = allServiceNames.slice(startIndex, startIndex + BATCH_SIZE);
                    var batchApiNames = allServiceApiNames.slice(startIndex, startIndex + BATCH_SIZE);

                    var batchFormData = new FormData();
                    batchFormData.append('provider_id', allFormData.get('provider_id'));
                    batchFormData.append('platform_id', allFormData.get('platform_id'));
                    batchFormData.append('_token', $('meta[name="csrf-token"]').attr('content'));
                    
                    if (currentBatch === 0) {
                        allFormData.getAll('categories[]').forEach(c => batchFormData.append('categories[]', c));
                        allFormData.getAll('category_names[]').forEach(c => batchFormData.append('category_names[]', c));
                        allFormData.getAll('category_api_names[]').forEach(c => batchFormData.append('category_api_names[]', c));
                    }
                    
                    batchServices.forEach(s => batchFormData.append('services[]', s));
                    batchNames.forEach(n => batchFormData.append('service_names[]', n));
                    batchApiNames.forEach(a => batchFormData.append('service_api_names[]', a));
                    batchFormData.append('is_batch', '1');

                    try {
                        var response = await $.ajax({ 
                            url: routes.processUrl, 
                            type: 'POST', 
                            data: batchFormData, 
                            processData: false, 
                            contentType: false 
                        });
                        if (response.status === 'success') {
                            totalImported += (response.data.imported_services || 0);
                        }
                    } catch (err) {
                        Swal.fire('Lỗi', 'Có lỗi xảy ra ở lô ' + (currentBatch + 1) + '. ' + (err.responseJSON ? err.responseJSON.message : ''), 'error');
                        return;
                    }
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Import hoàn tất',
                    text: 'Đã nhập thành công ' + totalImported + ' dịch vụ.',
                    confirmButtonText: 'Đóng'
                }).then(() => {
                    window.location.href = routes.indexUrl;
                });
            }
        });

        // Tìm kiếm thời gian thực (Real-time search)
        $(document).on('input', '#serviceSearchInput', function () {
            var query = $(this).val().toLowerCase().trim();
            
            $('.card[data-category-index]').each(function () {
                var $catGroup = $(this);
                var hasVisible = false;

                // Lọc trong Bảng (Table mode cho Desktop) và Thẻ (Card mode cho Mobile)
                $catGroup.find('tbody tr, .import-service-card').each(function () {
                    var $item = $(this);
                    var text = $item.text().toLowerCase();

                    if (query === '' || text.indexOf(query) !== -1) {
                        $item.removeClass('d-none');
                        hasVisible = true;
                    } else {
                        $item.addClass('d-none');
                    }
                });

                // Ẩn/Hiện luôn Nhóm danh mục nếu không có dịch vụ nào khớp
                if (hasVisible) {
                    $catGroup.removeClass('d-none');
                } else {
                    $catGroup.addClass('d-none');
                }
            });
        });

        $(document).on('change', '.service-checkbox', function () {
            var m = $(this).attr('class').match(/category_(\d+)_service/);
            if (m && m[1]) updateCategoryCheckbox(m[1]);
        });
    });

    window.updateImportServiceDescription = function (categoryIndex, serviceIndex, html) {
        var plainShort = (html || '').replace(/<[^>]+>/g, '').trim();
        var displayShort = plainShort.length > 80 ? plainShort.substring(0, 80) + '...' : (plainShort || 'Không có mô tả');

        if (window.__importServiceDescs[categoryIndex]) {
            window.__importServiceDescs[categoryIndex][serviceIndex] = html || '';
        }

        ['_table', '_card'].forEach(function (suffix) {
            var cb = $('#service_' + categoryIndex + '_' + serviceIndex + suffix);
            if (cb.length) {
                try {
                    var val = JSON.parse(cb.val().replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
                    val.desc = html || '';
                    cb.val(JSON.stringify(val).replace(/"/g, '&quot;').replace(/&/g, '&amp;'));
                } catch (e) { }
            }
        });

        $('#service_desc_display_' + categoryIndex + '_' + serviceIndex).text(displayShort);
        if (window.Swal) Swal.fire({ icon: 'success', title: 'Cập nhật thành công', showConfirmButton: false, timer: 1000, position: 'top-end', toast: true });
    };

    window.generateAiForImportRow = async function (categoryIndex, serviceIndex) {
        var aiUrl = pageEl.getAttribute('data-ai-url');
        var aiPrompt = $('#ai_import_prompt').val() || pageEl.getAttribute('data-ai-prompt');
        var rowKey = String(categoryIndex) + '_' + String(serviceIndex);
        var liveName = $('#service_name_' + categoryIndex + '_' + serviceIndex).val();
        var liveDesc = (window.__importServiceDescs[categoryIndex]) ? (window.__importServiceDescs[categoryIndex][serviceIndex] || '') : '';
        if (!window.__importAiBasePayload[rowKey]) {
            window.__importAiBasePayload[rowKey] = {
                name: liveName,
                note: liveDesc
            };
        }
        var currentName = window.__importAiBasePayload[rowKey].name || '';
        var currentDesc = window.__importAiBasePayload[rowKey].note || '';

        if (!currentName) return;

        showHamsterLoadingPopup('\u0110ang g\u1ecdi API AI...', 'H\u1ec7 th\u1ed1ng \u0111ang t\u1ed1i \u01b0u l\u1ea1i t\u00ean d\u1ecbch v\u1ee5 v\u00e0 m\u00f4 t\u1ea3.');

        try {
            var response = await fetch(aiUrl, {
                method: 'POST',
                skipGlobalLoader: true,
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                body: JSON.stringify({ name: currentName, note: currentDesc, prompt: aiPrompt })
            });

            var result = await response.json();
            if (result.status === 'success' && result.data) {
                var newName = result.data.name || currentName;
                var newNote = result.data.note || currentDesc;

                $('#service_name_' + categoryIndex + '_' + serviceIndex).val(newName);
                $('#service_name_display_' + categoryIndex + '_' + serviceIndex).text(newName);
                window.updateImportServiceDescription(categoryIndex, serviceIndex, newNote);
                syncServiceCheckboxValue(categoryIndex, serviceIndex, newName);

                Swal.fire({ icon: 'success', title: 'Tối ưu hoàn tất', timer: 1000, showConfirmButton: false });
            } else {
                throw new Error(result.message || 'Lỗi từ AI');
            }
        } catch (err) {
            if (typeof Swal !== 'undefined') Swal.fire('Lỗi', err.message || 'Không thể gọi AI lúc này.', 'error');
        } finally {
            closeAnyLoadingUi();
        }
    };
})();
