
$(document).ready(function() {
    function TaoSoNgauNhien(min, max){
        return Math.floor(Math.random() * (max - min)) + min;
    }
    // Khởi tạo Select2 cho dropdown nền tảng
    $('#social').select2({
        templateResult: formatOption,
        templateSelection: formatOption,
        minimumResultsForSearch: Infinity // Tắt tìm kiếm
    });

    // Hàm định dạng tùy chọn
    function formatOption(option) {

        var $option = $(option.element);
        var html = $option.data('html');
        return $(html);

    }
    $('#service').change(function() {

        updateFormAction();
        // console.log('sdsdfds');
    });

    function updateFormAction() {


        var serviceSlug = $('#service').val().split('-')[1];

        // Kiểm tra nếu cả hai giá trị đã được chọn
        if (serviceSlug) {
            // var provider_package = $('input[name=provider_package]').parent();
            // provider_package.empty();
            $('#provider_package').val(serviceSlug);
            // provider_package.append(`<input type="hidden" name="provider_package" id="provider_package" value="${serviceSlug}">`);

        }
    }

    // Khi thay đổi nền tảng, cập nhật danh sách dịch vụ
    $('select[name=social]').change(function() {
        $.ajax({
            url: "/service/checking",
            method: "POST",
            data: {
                _token: $('meta[name="csrf-token"]').attr('content'),
                id: $(this).val()
            },
            dataType: "JSON",
            success: function(data) {
                if (data.status == 'success') {
                    var service = $('#service');
                    service.empty();
                    showElm($('#reactions_type'), 'off');
                    showElm($('#quantity_type'), 'off');
                    showElm($('#comments_type'), 'off');
                    var provider_server = $('#provider_server');
                    
                    provider_server.empty();
                    var option1 = $('<option>', {
                        value: '',
                        text: `<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>'
                    );
                    provider_server.append(option1);
                    showElm($('#minute_type'), 'off');
                    showElm($('#time_type'), 'off')
                    showElm($('#posts_type'), 'off');
                    var option1 = $('<option>', {
                        value: '',
                        text: `<span class=""><i class="fa fa-thumbtack"></i>&ensp;Phân loại</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-thumbtack"></i>&ensp;Phân loại</span>'
                    );
                    
                    service.append(option1);

                    $.each(data.data, function(key, value) {
                        var option = $('<option>', {
                            value: value.id + '-' + value.package,
                            text: value
                                .name // Sử dụng 'data-html' để lưu trữ HTML
                        }).data('html', '<span><img src="' + value
                            .social_image +
                            '" alt="" width="13" class="rounded-circle"> ' +
                            value.name + '</span>');

                        
                        service.append(option);
                       
                    });

                    // Khởi tạo Select2 cho dropdown dịch vụ
                    service.select2({
                        templateResult: formatOption,
                        templateSelection: formatOption,
                        minimumResultsForSearch: Infinity // Tắt tìm kiếm
                    });
                    updateFormAction();
                }
            },
            error: function(data) {
                if (data.status == 500) {
                    toastr.error(data.responseJSON.message);
                }
            }
        });
    });

    // Khởi tạo Select2 cho dropdown dịch vụ
    $('#service').select2({
        templateResult: formatOption,
        templateSelection: formatOption,
        minimumResultsForSearch: Infinity // Tắt tìm kiếm
    });
    $('#provider_server').select2({
        templateResult: formatOption,
        templateSelection: formatOption,
        minimumResultsForSearch: Infinity // Tắt tìm kiếm
    });

 
 
const exchangeRates = {
    'VND': 25500, // 1 USD = 25500 VND
    'USD': 1
};

function getExchangeRate(fromCurrency, toCurrency) {
    // Ensure that 'fromCurrency' and 'toCurrency' are valid
    if (!(fromCurrency in exchangeRates) || !(toCurrency in exchangeRates)) {
        console.error('Invalid currency:', fromCurrency, toCurrency);
        return 1;
    }
    return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
}

function updateAmounts(selectedCurrency) {
    const elements = document.querySelectorAll('.amount_te');

    elements.forEach(element => {
        // Extract the text content
        const text = element.textContent.trim();
        
        // Identify the currency symbol or format
        let amount, currency;
        if (text.includes('₫')) {
            amount = parseFloat(text.replace('₫', '').replace(',', ''));
            currency = 'VND';
        } else if (text.includes('$')) {
            amount = parseFloat(text.replace('$', '').replace(',', ''));
            currency = 'USD';
        } 
        else if (text.includes('VND')) {
            amount = parseFloat(text.replace('VND', '').replace(',', ''));
            currency = 'VND';
        } 
        else if (text.includes('USD')) {
            amount = parseFloat(text.replace('USD', '').replace(',', ''));
            currency = 'USD';
        } 
        else {
            // Default assumption if no specific currency is mentioned
            amount = parseFloat(text.replace(',', ''));
            currency = 'VND'; // Default to VND if no currency is specified
        }

        // Get the exchange rate
        const rate = getExchangeRate(currency, selectedCurrency);
        let newAmount;
        
        if (selectedCurrency === 'USD') {
            newAmount = (amount * rate).toFixed(2);
            // Ensure that very small amounts are not rounded to 0
            if (newAmount <= 0) {
                newAmount = (amount * rate).toFixed(8);
            }
            else{
                newAmount = (amount * rate).toFixed(3); // Round to 2 decimal places
            }
            
        } else {
            newAmount = formatNumber((amount * rate).toFixed(0));
        }

        // Update the element's text
        if (selectedCurrency === 'USD') {
            element.textContent = `${newAmount} $`;
        } else {
            element.textContent = `${newAmount} ₫`;
        }
        

        
    });
}

    $('select[name=service]').change(function() {
        $.ajax({
            url: "/service/server/checking",
            method: "POST",
            data: {
                _token: $('meta[name="csrf-token"]').attr('content'),
                id: $(this).val()
            },
            dataType: "JSON",
            success: function(data) {
                if (data.status == 'success') {
                    var provider_server = $('#provider_server');
                    provider_server.empty();
                    showElm($('#reactions_type'), 'off');
                    showElm($('#quantity_type'), 'off');
                    showElm($('#comments_type'), 'off');
                    showElm($('#minute_type'), 'off');
                    showElm($('#time_type'), 'off')
                    showElm($('#posts_type'), 'off');
                    var option1 = $('<option>', {
                        value: '',
                        text: `<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>'
                    );
                    provider_server.append(option1);
                    const selectedCurrencsy = localStorage.getItem('selectedCurrency') || 'VND';
                   
                    $.each(data.data, function(key, value) {
                        var price_te;
                        if(selectedCurrencsy ==='USD'){
                            price_te = (value.price_user/25500).toFixed(8) + ' $';
                            price_te_1 = (value.price_user/25500).toFixed(8);
                        }
                        else{
                            price_te = value.price_user+ ' VND';
                            price_te_1 = value.price_user;

                        }
                        if(value.visibility === 'public'){
                        var option = $('<option>', {
                            value: 'sv-' + value.package_id + '_' +value.id,
                            text: value.name,
                            disabled: value.status !== 'active', // Disable the option if status is not 'active'
                            
                        }).data('html',
                            '<div class="d-flex align-items-center"><img class="rounded-circle me-2" width="13" src="' +
                            value.social_image +
                            '"><span class="badge badge-primary rounded-pill fw-bolder me-1">' +
                            value.id + '</span>- ' + value.name +
                            ' - <span class="text-primary fw-bolder ms-1 ">' +
                            price_te + '</span></div> <span class="mt-1"><span class="badge badge-outline badge-danger rounded-pill fs-9 me-1">Độc quyền</span><span class="badge badge-outline badge-success rounded-pill fs-9 me-1">Mới</span></span>'
                        ).attr({
                                'data-quantity': value.quantity_status || '',
                                'data-reaction': value.reaction_status || '',
                                'data-comment': value.comments_status || '',
                                'data-getuid': value.get_uid || '',
                                'data-minute': value.minutes_status || '',
                                'data-reaction_type': value.reaction_data || '',
                                'data-comment_type': value.comments_data || '',
                                'data-minute_type': value.minutes_data || '',
                                'data-posts': value.posts_status || '',
                                'data-posts_type': value.posts_data || '',
                                'data-time': value.time_status || '',
                                'data-time_type': value.time_data || '',
                                'data-price': price_te_1 || ''
                            }).attr('onclick', 'checkPriceLt()');
                        
                            provider_server.append(option);
                        }
                    });

                    // Attach the change event listener
                    
                  

                    provider_server.select2({
                        templateResult: formatOption,
                        templateSelection: formatOption,
                        minimumResultsForSearch: Infinity
                    });
                    const selectedCurrency = localStorage.getItem('selectedCurrency') || 'VND';
                    updateAmounts(selectedCurrency);
 

                } else {
                    console.log('error');
                    var provider_server = $('#provider_server');
                    provider_server.empty();
                    var option1 = $('<option>', {
                        value: '',
                        text: `<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-thumbtack"></i>&ensp;Dịch vụ</span>'
                    );
                    provider_server.append(option1);
                    provider_server.select2({
                        templateResult: formatOption,
                        templateSelection: formatOption,
                        minimumResultsForSearch: Infinity
                    });
                }
            },
            error: function(data) {
                if (data.status == 500) {
                    toastr.error(data.responseJSON.message);
                }
            }
        });

        function formatOption(option) {
            var $option = $(option.element);
            var html = $option.data('html');
            return $(html);
        }
    });

    $('#provider_server').select2({
        templateResult: formatOption,
        templateSelection: formatOption,
        minimumResultsForSearch: Infinity
    });

    const selectedCurrency34 = localStorage.getItem('selectedCurrency') || 'VND';
    updateAmounts(selectedCurrency34);
 
    //change actual_service value
    $('select[name=provider_server]').change(function() {
        $.ajax({
            url: "/server/checking",
            method: "POST",
            data: {
                _token: $('meta[name="csrf-token"]').attr('content'),
                id: $(this).val()
            },
            dataType: "JSON",
            success: function(data) {
                if (data.status == 'success') {


                    var timetb = $('input[name=timetb]').parent();

                    var name_sv = $('div[name=name_sv]').parent();
                    var description = $('div[name=description]').parent();
                    var min = $('input[name=min]').parent();
                    var price = $('input[name=price]').parent();
                    var max = $('input[name=max]').parent();
 
                    name_sv.empty();
                    description.empty();




                    timetb.empty();

                    price.empty();
                  
                 
                    min.empty();
                    max.empty();
                    
                    const selectedCurrencsy = localStorage.getItem('selectedCurrency') || 'VND';
                    var price_te_3;
                    if(selectedCurrencsy ==='USD'){
                        price_te_3 = (data.data.price_user/25500).toFixed(8);
                        price_te_4 = ' $';
                      
                    }
                    else{
                        price_te_3 = data.data.price_user;
                        price_te_4 = ' VND';

                    }
                    price.append(`  <label>Price per 1000</label>
                    <input class="form-control amount_te" name="price" type="text" value="${formatNumber((price_te_3 * 1000))} ${price_te_4}"  disabled="">`);


                    timetb.append(`<label class="form-label"><span data-lang="Thời gian hoàn thành trung bình">Thời gian hoàn thành
                            trung bình</span></label>
                    <input type="text" class="form-control" disabled="disabled"
                        value="${TaoSoNgauNhien(1,24)}h ${TaoSoNgauNhien(1,60)}m ${TaoSoNgauNhien(1,60)}s" name="timetb"> <span class="form-text fst-italic">* <span data-lang="Average time description">Thời gian trung bình hoàn thành số lượng 1000 của 10 đơn hàng gần nhất</span></span>`);
$('.div-choose-service').html(`<span class="fs-3 fw-bold"><i class="fa fa-thumbtack"></i>&ensp;  ${data.data.name}</span>`);
                    
$('.div-description').html(`${data.data.details}`);
                      $('.ipt-quantity').attr('placeholder', `Mua Tối Thiểu ${data.data.min}`);
                }


            },
            error: function(data) {
                if (data.status == 500) {
                    toastr.error(data.responseJSON.message);
                }
            }
        })
    })
});
 