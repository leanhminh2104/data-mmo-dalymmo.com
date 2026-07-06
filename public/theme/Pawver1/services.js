
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
                        text: `<span class=""><i class="fa fa-star"></i>&ensp;Dịch Vụ MXH</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-star"></i>&ensp;Chọn Dịch Vụ</span>'
                    );
                    provider_server.append(option1);
                    showElm($('#minute_type'), 'off');
                    showElm($('#time_type'), 'off')
                    showElm($('#posts_type'), 'off');
                    var option1 = $('<option>', {
                        value: '',
                        text: `<span class=""><i class="fa fa-list"></i>&ensp;Máy Chủ : </span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-list"></i>&ensp;Chọn Máy Chủ</span>'
                    );
                    
                    service.append(option1);

                    $.each(data.data, function(key, value) {
                        var option = $('<option>', {
                            value: value.id + '-' + value.package,
                            text: value
                                .name // Sử dụng 'data-html' để lưu trữ HTML
                        }).data('html', '<span><img src="' +value.social_image +'" class="rounded" style="width: 20px; height: 18px; margin-right: 10px;" />' +
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
    
}
function showElm(elm, status) {
    if (status === 'on') {
        elm.show();
    } else {
        elm.hide();
    }
}

function updateAmounts(selectedCurrency) {
    
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
                        text: `<span class=""><i class="fa fa-list"></i>&ensp;Dịch vụ</span>`
                    }).data('html',
                        '<span class=""><i class="fa fa-list"></i>&ensp;Dịch vụ</span>'
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
                            '<div class=""><img src="' +value.social_image +'" class="rounded" style="width: 20px; height: 20px; margin-right: 10px;" /><span class="fw-bolder me-1">' +
                            value.id + ' </span>- ' + value.name +
                            ' - <span class="text-primary fw-bolder ms-1 ">' +
                            price_te + '</span></div><span class="mt-1"><span class="badge badge-outline badge-success rounded-pill fs-9 me-1">Nhà Sản Xuất</span><span class="badge badge-outline badge-danger rounded-pill fs-9 me-1">HOT</span></span>'
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


                
                    var name_sv = $('span[name=name_sv]').parent();
                    var min = $('span[name=min]').parent();
                    var max = $('span[name=max]').parent();
                    var description = $('div[name=description]').parent();
             
                
 
                    name_sv.empty();
                    description.empty();
                    min.empty();
                    max.empty();


 
                 
                
                    min.append(`<span class=" fw-bold" id="min" name="min"  >Min : &ensp; ${formatNumber(data.data.min)}</span>`);
                    max.append(`<span class=" fw-bold" id="max" name="max"  >Max : &ensp; ${formatNumber(data.data.max)}</span>`);
                    name_sv.append(`<span class="fs-6 fw-bold" id="name_sv" name="name_sv"  ><img src="${data.data.image}" class="rounded" style="width: 20px; height: 20px; margin-right: 5px;" /> ${data.data.name}</span>`);
                    description.append(
                        ` 
                  <div id="description" name="description"> ${data.data.details}           
       
  </div>
       

`
                    );
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
 