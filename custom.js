

var domain = 'http://sujathagold.com:8080';

//API keys variables
var urlD = 'https://track.delhivery.com';
var clientKeyD = '52f81411e7185b24602a6b2b4b52ac491ed00a24';
var clientName = 'SUJATHAFRANCHISE';
var clientKeyDNew = 'c5b56fa680db359aae2c36e41ce64bc3b82fac7d';
var clientNameNew = 'HRENTERPRISESFRANCHISE';

let ordersData;
let fecthDataOrders;
let profileData;


function createOrder(orderData) {
  var newElementSuccess = $('<p>Order Successfully Created</p>');
  var newElementFailure = $('<p>Order Failed, Please try again</p>');
  // console.log(data);
  fetch(`${domain}/createOrder`, {
    method: 'POST', // Specify the HTTP method
    headers: {
      'Content-Type': 'application/json', // Set the content type to JSON
    },
    body: JSON.stringify(orderData.fields), // Convert the data to JSON format
  })
    .then(response => response.json())
    .then(data => {
      // console.log('Response:', data);
      // Process the response data
      orderSumitted(orderData, data.insertId);
      $('form#createOrder')[0].reset();
      newElementSuccess.insertAfter('.OrderSubmit');
      setTimeout(function () {
        newElementSuccess.remove(); // Remove the new element
      }, 3000);
    })
    .catch(error => {
      console.error('Error:', error);
      newElementFailure.insertAfter('.OrderSubmit');
      setTimeout(function () {
        newElementFailure.remove(); // Remove the new element
      }, 3000);
    });
}

  //Mark as dispatched
  function deleteOrders(data, e) {
    var tableId = $(e.target).closest('.tab-pane').attr('id');
    fetch(`${domain}/deleteOrders`, {
    method: 'POST', // Specify the HTTP method
    headers: {
      'Content-Type': 'application/json', // Set the content type to JSON
    },
    body: JSON.stringify(data), // Convert the data to JSON format
  })
    .then(response => response.json())
    .then(data => {
      // console.log('Response:', data);
      // Process the response data
      refreshOrders();
    })
    .catch(error => {
      console.error('Error:', error);
    });  
    $(e.target).removeAttr("disabled");
  }


function fetchProfile() {
  fetch(`${domain}/getProfile`)
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      // Process the data received from the server
      profileData = data;
      renderProfile(profileData);
      // $loading.hide();
    })
    .catch(error => {
      console.error('Error:', error);
      // $loading.hide();
    });
}

function renderProfile(data) {
  $("#profileUpdate")
    .find(":input")
    .each(function () {
      var name = $(this).attr("name");
      var value = data[name]?.toString().replace(/\\n/g, '\n');
      $(this).val(value);
    });
  initForm();
}

function orderSumitted(data, resp) {
  // console.log(resp);
  var orderData = data.fields;

  //Create Delhivery WayBill Number
  if (orderData.vendor === "2") {
    delhiveryApis(
      "GET",
      "/waybill/api/fetch/json/",
      {
        token: clientKeyD,
        client_name: clientName,
      },
      trackingDCallback,
      resp
    );
  } else if (orderData.vendor === "5") {
    delhiveryApis(
      "GET",
      "/waybill/api/fetch/json/",
      {
        token: clientKeyDNew,
        client_name: clientNameNew,
      },
      trackingDCallback,
      resp
    );
  }
}

//Call back after fetching delhivery waybill
function trackingDCallback(data, orderId) {
  // console.log('trackingDCallback', data, orderId);
  //Update Tracking number for Delhivery Order
  fetch(`${domain}/updateOrder/${orderId}/${data}`)
    .then(response => response.json())
    .then(data => {
      // console.log('Response:', data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

//Click on Order tab
$("#orders-tab").click(function () {
  refreshOrders();
});

//Refresh Orders
function refreshOrders() {
  if ($.fn.DataTable.isDataTable("#example")) {
    $("#example").dataTable().fnDestroy();
    // fetchOrders("example");
  }
  fetchOrders("example");
}

//Fetch Orders
function fetchOrders(div) {

  $('.loading').removeClass('hide').addClass('show');
  // console.log('Loading started')

  // This code runs in the user's browser
  fetch(`${domain}/getOrders`)
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      // Process the data received from the server
      renderOrders('example', data, false);
      $('.loading').removeClass('show').addClass('hide');
    })
    .catch(error => {
      console.error('Error:', error);
      $('.loading').removeClass('show').addClass('hide');
    });
}

//convert date
function formateDates(date) {
  if (date && date.length) {
    var dateArr = date.split("-");
    dateArr.reverse();
    return dateArr.join("-");
  } else {
    return "null";
  }
}

// var currentTable;
function renderOrders(div, data, isParse) {
  let parseData;

  if (isParse) {
    parseData = [];
    $.each(data, function (key, value) {
      value.fields.key = key;
      parseData.push(value.fields);
    });
  } else {
    parseData = data;
  }
  const today = new Date();
  const sevenDaysBefore = moment().subtract(5, 'days');

  if (div === 'example') {
    parseData = parseData.filter(function (order) {
      var date = new Date(formateDates(order.time));
      return date; // >= sevenDaysBefore && date <= today;
    });
  }

  // currentTable =
  $("#" + div).DataTable({
    data: parseData,
    order: [[1, "desc"]],
    "lengthMenu": [[25, 50, 100, 250, 500, -1], [25, 50, 100, 250, 500, "All"]],
    createdRow: function (row, parseData, dataIndex) {
      $(row).attr({
        "data-bs-id": parseData.id,
        //"data-bs-toggle": "modal",
        "data-bs-target": "#editModal",
      });
      // console.log(parseData);
      if (parseData.isDispatched) {
        $(row).addClass("orderDispatched");
      }
    },
    drawCallback: function () {
      if (div === "exportTable") {
        $("#exportOrders .bulkBtn").removeAttr("disabled");
      }

      if (div === "deleteOrdersTable") {
        $("#selectAll, .checkOrder").removeAttr("disabled");
      }

      $("body").on("click", "#selectAll", function () {
        var $table = $(this).closest("table");
        var isChecked = $(this).is(":checked");
        $table.find("tbody tr").each(function () {
          $(this).find("td:first input")[0].checked = isChecked;
        });
      });
    },
    columns: [
      {
        title: "<input id='selectAll' type='checkbox' />",
        orderable: false,
        style: "os",
        render: function () {
          return "<input name='rowOrder' class='checkOrder' type='checkbox' />";
        },
      },
      {
        title: "Date",
        width: "10%",
        data: "time",
        render: function (data) {
          if (data && data.length) {
            var from = data.split("-");
            return from[2] + "-" + from[1] + "-" + from[0];
          }
          return "";
        },
      },
      { title: "Name", data: "name", width: "10%" },
      { title: "Mobile", data: "mobile" },
      { title: "Reference", data: "ref" },
      { title: "Pincode", data: "pincode" },
      { title: "Reseller", data: "rname", width: "5%" },
      {
        title: "Courier",
        data: "vendor",
        className: "vendorClass",
        render: function (data) {
          var courier = "";
          switch (data) {
            case "1":
              courier = "India Post";
              break;
            case "2":
              courier = "Delhivery COD";
              break;
            case "3":
              courier = "DTDC";
              break;
            case "4":
              courier = "Xpressbees";
              break;
            case "5":
              courier = "Delhivery New";
              break;
          }
          return courier;
        },
      },
      {
        title: "Tracking ID",
        data: "tracking",
        className: "trackingClass",
      },
      {
        title: "Order Status", width: "15%", data: "orderStatus",
        className: "statusClass",
        render: function (data) {
          var orderStatus = "Unknown";
          if (data) {
            orderStatus = data;
          }
          return orderStatus;
        }
      },
    ],
  });
}

function initForm() {
  // console.log("init form");
  $("[name=vendor]").trigger("change");
  $("#createOrder").find(".success").text("").removeClass("sucess");
}

function authCheck() {
  // Check if the 'isLoggedIn' cookie exists
  const isLoggedInCookie = Cookies.get('isLoggedIn');
  if (isLoggedInCookie === 'true') {
    // Cookie exists and its value is 'true'
    console.log('User is logged in');
    $("#auth-modal").addClass("hide").removeClass('show');
    fetchProfile();
    // You can perform further actions for authenticated users here
  } else {
    // Cookie either doesn't exist or its value is not 'true'
    console.log('User is not logged in');
    $("#auth-modal").addClass("show").removeClass('hide');
    // You can handle unauthenticated users here
  }
}

$(document).ready(function () {
  authCheck();

  var page = window.page;

  var $loading;
  $loading = $(".loading");
  // fetchOrders("example");

  $('.loginBtn').on('click', function(e){
    e.preventDefault();
    var $this = $('#loginUser');
    var username = $this.find('.username').val();
    var password = $this.find('.password').val();
    // Send a POST request to the server
    fetch(`${domain}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Login successful') {
          // Authentication succeeded
          // message.textContent = 'Login successful';
          Cookies.set('isLoggedIn', 'true');
          // Redirect or perform other actions as needed
          $("#auth-modal").addClass("hide").removeClass('show');
          authCheck();
        } else {
          // Authentication failed
          Cookies.set('isLoggedIn', 'false');
          // message.textContent = 'Authentication failed';
          $("#auth-modal").addClass("show").removeClass('hide');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        Cookies.set('isLoggedIn', 'false');
        message.textContent = 'Error occurred during login';
        $("#auth-modal").addClass("show").removeClass('hide');
      });
  })

  $("body").on("submit", "#createOrder", function (event) {
    event.preventDefault();
    var fields = {};
    $(this).find("[name=time]").val(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val()?.trim();
      });
    var obj = { fields: fields };
    if (obj.fields.ref == "") {
      obj.fields.ref = obj.fields.mobile.slice(-5);
    }
    createOrder(obj);
  });

  function editModalMethod(event) {
    var row = event.relatedTarget;
    var data = row["data-order-id"];
    $loading.show();
    var $updateOrderForm = $("#createOrder").clone(true);
    $updateOrderForm.removeClass("hide").find(".OrderSubmit").hide();
    $updateOrderForm.find(".dateId").removeClass("hide");
    $("#updateOrderContainer").html(
      $updateOrderForm.attr({
        id: "updateOrder",
        "data-order-id": data,
      })
    );

    fetch(`${domain}/getOrder/${data}`)
      .then(response => response.json())
      .then(data => {
        // console.log(data);
        // Process the data received from the server
        var orderData = data;

        // console.log(orderData);
        $("#updateOrder")
          .find("select")
          .each(function () {
            var $this = $(this);
            var name = $this.attr("name");
            $this.val(orderData[name]).trigger("change");
          });

        $("#updateOrder")
          .find(":input")
          .not("button, select")
          .each(function () {
            var $this = $(this);
            var name = $this.attr("name");
            $this.val(orderData[name]);
          });
        $loading.hide();
        $loading.removeClass('show').addClass('hide');
      })
      .catch(error => {
        console.error('Error:', error);
        $loading.removeClass('show').addClass('hide');
      });
  }

  // var $dataTable = $('.dataTable');
  $("body").on("click", ".dataTable tbody tr", function (event) {
    // console.log(event.target);
    if (!$(event.target).hasClass("checkOrder")) {
      $("#editModal").modal("show", {
        "data-order-id": $(this).attr("data-bs-id"),
      });
    }
  });

  var $editModal = $("#editModal");
  $editModal.on("show.bs.modal", function (event) {
    // console.log(event, data);
    editModalMethod(event);
  });

  $editModal.on("hidden.bs.modal", function (event) {
    $("#updateOrder").html("");
  });

  $("body").on("submit", "#updateOrder", function (event) {
    event.preventDefault();
    var fields = {};
    var orderId = $(this).attr("data-order-id");

    // $(this).find("[name=time]").text(moment().format("DD-MM-YYYY"));
    $(this)
      .find(":input")
      .not("button")
      .each(function () {
        fields[this.name] = $(this).val();
      });

    var obj = { fields: fields };
    if (obj.fields.ref == "") {
      obj.fields.ref = obj.fields.mobile.slice(-5);
    }

    if (!obj.fields.key || obj.fields.key == "") {
      obj.fields.id = orderId;
    }

    // console.log(obj);

    fetch(`${domain}/updateOrderDetails/${orderId}`, {
      method: 'PUT', // Specify the HTTP method
      headers: {
        'Content-Type': 'application/json', // Set the content type to JSON
      },
      body: JSON.stringify(obj.fields), // Convert the data to JSON format
    })
      .then(response => response.json())
      .then(data => {
        // console.log('Response:', data);
        $(".modal").find(".btn-close").click();
        refreshOrders();
        // Process the response data
        // orderSumitted(orderData, data.insertId);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  });

  $(".submitUpdate").click(function () {
    $("#updateOrder").submit();
  });

  $(".cancelUpdate").click(function () {
    $("#updateOrder")[0].reset();
  });

  //Calender Plugin
  $("#fromdatepicker, #fromdatepicker1").datepicker({
    dateFormat: "dd-mm-yy",
  });
  $("#todatepicker, #todatepicker1").datepicker({
    dateFormat: "dd-mm-yy",
  });

  $("#exportOrder").change(function () {
    $("#exportOrders .bulkBtn").attr("disabled", "disabled");
  });

  //convert date
  function formateDate(date) {
    if (date && date.length) {
      var dateArr = date.split("-");
      dateArr.reverse();
      return dateArr.join("-");
    } else {
      return "null";
    }
  }

  var exportData;
  // fetchTableOrders('exportOrder', 'exportTable');

  $("#exportOrder").submit(function (event) {
    event.preventDefault();
    fetchTableOrders(this, "exportTable");
  });

  $("#deleteOrders").submit(function (event) {
    event.preventDefault();
    fetchTableOrders(this, "deleteOrdersTable");
  });

  //Export orders table
  function fetchTableOrders(order, table) {
    var filters = {};
    $(order)
      .find(":input")
      .not("button")
      .each(function () {
        filters[this.name] = $(this).val();
      });

    // This code runs in the user's browser
    fetch(`${domain}/getOrders`)
      .then(response => response.json())
      .then(data => {
        // Process the data received from the server
        ordersData = data;
        fetchOrderFunc(ordersData, table, filters);
        $loading.removeClass('show').addClass('hide');
      })
      .catch(error => {
        console.error('Error:', error);
        $loading.removeClass('show').addClass('hide');
      });
  }

  //Export orders inner function
  function fetchOrderFunc(ordersData, table, filters) {
    let parseData = ordersData;

    var filteredOrders = parseData.filter(function (order) {
      return order.vendor == filters.vendor && !order.isDispatched;
    });

    var startDate = new Date(formateDate(filters.fromdatepicker));
    var endDate;

    if (formateDate(filters.todatepicker) == "null") {
      endDate = new Date(formateDate(filters.fromdatepicker));
    } else {
      endDate = new Date(formateDate(filters.todatepicker));
    }

    var resultProductData = filteredOrders.filter(function (order) {
      var date = new Date(formateDate(order.time));
      return date >= startDate && date <= endDate;
    });

    if ($.fn.DataTable.isDataTable("#" + table)) {
      $("#" + table)
        .dataTable()
        .fnDestroy();
    }

    exportData = resultProductData;
    renderOrders(table, resultProductData, false);
  }

  $(".bulkBtn").click(function (e) {
    e.preventDefault();
    var vendor = $("#exportOrders").find("[name=vendor").val();
    generateXL(vendor, exportData);
  });

  $("[name=cod]").change(function () {
    var $this = $(this);
    var $form = $this.closest("form");
    var val = $this.val();
    if (val == 0) {
      $form.find(".hide-cod").removeClass("show-cod");
    } else {
      $form.find(".hide-cod").addClass("show-cod");
    }
  });

  //Select Vendor Change
  $("[name=vendor]").change(function () {
    var $this = $(this);
    var $form = $this.closest("form");
    var $pin = $form.find("[name=pincode]");
    var val = $this.val();
    var pickupDArray = profileData ? profileData.pickup.split(",") : [];
    // console.log(pickupDArray)
    var options = "";
    $(pickupDArray).each(function (i, key) {
      options = options + "<option>" + key.trim() + "</option>";
    });
    var $pickupD = $form.find("[name=pickupD]").html(options);
    var city = $form.find("[name=city]").val();
    if (val == 2 || val == 4 || val == 5) {
      $form.find(".hide-2").addClass("show-2");
      $pin.addClass("pinSearch");
    } else {
      $form.find("[name=city]").val(city).removeAttr("readonly");
      $form.find("[name=state]").val("").removeAttr("readonly");
      $form.find("[name=country]").val("").removeAttr("readonly");
      $form.find(".hide-2").removeClass("show-2");
      $pin.removeClass("pinSearch");
    }
  });

  $('body').on("blur", '.pinSearch', function (event) {
    var city, state, country;
    var $this = $(this);
    var $form = $this.closest("form");
    var pincode = $this.val();
    var val = $form.find('[name=vendor').val();

    var obj = window.pincodes.filter(function (key) {
      return key.pin == pincode;
    });

    if (obj.length) {
      city = obj[0].city;
      state = obj[0].State;
      country = "India";
      $form.find("[name=city]").val(city); //.attr("readonly", "");
      $form.find("[name=state]").val(state); //.attr("readonly", "");
      $form.find("[name=country]").val(country); //.attr("readonly", "");
    }

    if (val == '2' || val == '5') {
      delhiveryApis(
        "GET",
        "/c/api/pin-codes/json/",
        {
          token: clientKeyDNew,
          filter_codes: pincode,
        },
        pincodeCallback,
        event.target
      );
    }
  });
});

var removeByAttr = function (arr, attr, value) {
  var i = arr.length;
  while (i--) {
    if (
      arr[i] &&
      arr[i].hasOwnProperty(attr) &&
      arguments.length > 2 &&
      arr[i][attr] === value
    ) {
      arr.splice(i, 1);
    }
  }
  return arr;
};

$(".groupAction").click(function (e) {
  e.preventDefault();
  var $this = $(this);
  var table = $("#example");
  if ($this.hasClass('exportAction')) {
    table = $('#exportTable');
  }
  var rows = table.find("tbody tr");
  var selectedRows = [];
  var rowLis = [];
  rows.each(function () {
    var row = $(this);
    var rowObj = {
      id: row.attr("data-bs-id"),
      vendor: row.find('.vendorClass').text(),
      tracking: row.find('.trackingClass').text()
    };
    var checkbox = row.find(".checkOrder");
    var disp = checkbox.is(":checked");
    if (disp) {
      selectedRows.push(row.attr("data-bs-id"));
      rowLis.push(rowObj);
    }
  });
  // console.log(rowLis);
  $(e.target).attr("disabled", "disabled");
  if ($this.hasClass("dispatched")) {
    markAsDispatched(selectedRows, e);
  } else if ($this.hasClass("printSlip")) {
    printSlips(selectedRows);
  } else if ($this.hasClass("deleteOrders")) {
    deleteOrders(selectedRows, e);
  }
  // else if ($this.hasClass("move-to-old")) {
  //   moveToOldOrders(selectedRows, e);
  // } 
  // else if ($this.hasClass("xpressStatus")) {
  //   checkXpressBeesStatus(rowLis, e);
  // }
  // else if ($this.hasClass("fetchData")) {
  //   fetchStatus(selectedRows, e);
  // }
});

var countSlips;

//Print Slips
function printSlips(data) {
  countSlips = data.length;
  $printHtml = $("#bulk-to-print").html("");
  $printHtml.removeClass("hide");

  $(data).each(function (index, val) {
    var orderId = val;
    var orderData;
    if(orderId) {
      fetch(`${domain}/getOrder/${orderId}`)
      .then(response => response.json())
      .then(data => {
        var orderData = data;
        generatePdf(orderData, index);
      })
      .catch(error => {
        $('.printSlip').removeAttr('disabled');
        console.error('Error:', error);
      }); 
    }
  });
}

//generate PDF
function generatePdf(data, index) {
  if (!data) {
    return;
  }
  var orderData = data;
  var $pageBreak = $('<div class="html2pdf__page-break">');
  var payment = orderData.cod == "1" ? "COD" : "PREPAID/PAID"
  console.log('count-', index, countSlips);
  if (orderData.vendor === "1") {
    $pageBreak.append("<h2>" + "Registered Parcel" + "</h2><br>");
    $pageBreak
      .append(
        "<h3 class='postDetails'>" +
        "<u>BNPL</u><br>" +
        "Unique Customer ID: 3000047704<br>" +
        "Contract No: 40185593<br>" +
        "</h3><br>"
      );
  } else if (orderData.vendor === "2") {
    // $pageBreak.append("<h1 class='logo-align center-align'><img src='suj.png'></h2><br>");
    $pageBreak.append("<h2 class='center-align'>" + "Delhivery Courier" + "</h2>");
    $pageBreak.append("<p class='center-align'>" + "(old account)" + "</p><br>");
    $pageBreak.append("<h3 class='center-align'>" + payment + (orderData.cod == "1" ? ": Rs." : "") + (orderData.cod == "1" ? orderData.codprice + "/-" : '') + "</h3><br>");
    $pageBreak.append("<h3 class='center-align'><svg class='barcode-track' data-tracking=" + orderData.tracking + "></svg></h3>");
  } else if (orderData.vendor === "5") {
    $pageBreak.append("<h2 class='center-align'>" + "Delhivery Courier" + "</h2>");
    $pageBreak.append("<p class='center-align'>" + "(new account)" + "</p><br>");
    $pageBreak.append("<h3 class='center-align'>" + payment + (orderData.cod == "1" ? ": Rs." : "") + (orderData.cod == "1" ? orderData.codprice + "/-" : '') + "</h3><br>");
    $pageBreak.append("<h3 class='center-align'><svg class='barcode-track' data-tracking=" + orderData.tracking + "></svg></h3>");
  } else {
    $pageBreak.append("<h2>" + "Courier" + "</h2><br>");
  }

  // $printHtml.append('<div class="html2pdf__page-break"></div>');
  // var $pageBreak = $printHtml.find(".html2pdf__page-break");
  $pageBreak
    .append("<div class='toAdd'><h4>To:</h4></div>")
    .append(
      orderData.name +
      "<br>" +
      orderData.address.replace(/(?:\r\n|\r|\n)/g, "<br>") +
      "<br>" +
      orderData.city +
      "<br> Pincode: " +
      orderData.pincode +
      "<br> Mobile: " +
      orderData.mobile
    );
  $pageBreak.append("<br><br>Ref:" + orderData.ref + "<br><br><br>");

  if (orderData.vendor === "1") {
    $pageBreak
      .append("<div class='fromAdd'><h4>From:</h4></div>")
      .append(
        (orderData.rname || profileData.cname) +
        "<br>" +
        (orderData.vendor === "1"
          ? profileData.retAddress.replace(/(?:\r\n|\r|\n)/g, "<br>") + "<br>"
          : "") +
        "Mobile: " +
        (orderData.rmobile || profileData.cnumber)
      );
  }


  $printHtml.append($pageBreak);

  $('.barcode-track').each(function () {
    var $this = $(this);
    var tracking = $this.attr('data-tracking');
    $this.JsBarcode(tracking);
  });

  console.log(countSlips, index+1, $printHtml.height());
  if (index+1 === countSlips) {
    
    // $printHtml.css('height', $printHtml.height() * 1.25);
    var element = $printHtml[0];
    var opt = {
      margin: 1,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      pagesplit: true,
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(element) //.save();
      .output("blob")
      .then(function (blob) {
        $('.printSlip').removeAttr('disabled');
        let url = URL.createObjectURL(blob);
        window.open(url); //opens the pdf in a new tab
        // $printHtml.addClass("hide");
      });
  }
}

//Mobile Number Validation
$("[name=mobile]").blur(function (e) {
  e.preventDefault();
  var $form = $(e.target).closest("form");
  var mobile = $form.find("[name=mobile");
  var message = $form.find(".mobileMessage");
  $form.find(".mobileMessage");
  if (!mobile.val().match("[0-9]{10}") && message) {
    // console.log("Please put 10 digit mobile number");
    message.addClass("error").removeClass("hide");
    message[0].innerHTML = "Required 10 digits for mobile number";
    return;
  } else {
    message.addClass("hide");
  }
});


window.onload = function () {
  // initForm();
  setTimeout(function () {
    if (!$(".loading").hasClass("hide")) {
      $(".loading").addClass("hide");
    }
  }, 5000);
};

function generateXL(type, data) {
  var createXLSLFormatObj = [];
  var xlsHeader;
  /* XLS Rows Data */
  var xlsRows = [];

  //India Post
  if (type == "1") {
    /* XLS Head Columns */
    xlsHeader = [
      "SL",
      "Barcode",
      "Ref",
      "City",
      "Pincode",
      "Name",
      "ADD1",
      "ADD2",
      "ADD3",
      "ADDREMAIL",
      "ADDRMOBILE",
      "SENDERMOBILE",
      "Weight",
      "COD",
      "InsVal",
      "VPP",
      "L",
      "B",
      "H",
      "ContentType",
      "Priority"
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        SL: index + 1,
        Barcode: value.tracking,
        Ref: value.ref + '-' + value.mobile || value.mobile.slice(-5),
        City: value.city,
        Pincode: value.pincode,
        Name: value.name,
        ADD1: value.address.replace(/\s+/g, ' ').substring(0, 15).trim(),
        ADD2: "",
        ADD3: "",
        ADDREMAIL: value.email,
        ADDRMOBILE: value.mobile,
        SENDERMOBILE: value.rmobile || profileData.cnumber,
        Weight: value.weight,
        COD: "",
        InsVal: "",
        VPP: "",
        L: "",
        B: "",
        H: "",
        ContentType: "",
        Priority: ""
      });
    });
  } else if (type == "2" || type == "5") {
    /* XLS Head Columns */
    xlsHeader = [
      "Waybill",
      "Reference No",
      "Consignee Name",
      "City",
      "State",
      "Country",
      "Address",
      "Pincode",
      "Phone",
      "Mobile",
      "Weight",
      "Shipment Length",
      "Shipment Breadth",
      "Shipment Height",
      "Payment Mode",
      "Package Amount",
      "Cod Amount",
      "Product to be Shipped",
      "Return Address",
      "Return Pin",
      "fragile_shipment",
      "Seller Name",
      "Seller Address",
      "Seller CST No",
      "Seller TIN",
      "Invoice No",
      "Invoice Date",
      "Quantity",
      "Commodity Value",
      "Tax Value",
      "Category of Goods",
      "Seller_GST_TIN",
      "HSN_Code",
      "Return Reason",
      "Vendor Pickup Location",
      "EWBN",
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        Waybill: value.tracking || "",
        ReferenceNo: value.ref + '-' + value.mobile || value.mobile.slice(-5),
        ConsigneeName: value.name,
        City: value.city,
        State: value.state,
        Country: value.country || "India",
        Address: value.address.replace(/\s+/g, ' ').trim(),
        Pincode: value.pincode,
        Phone: "",
        Mobile: value.mobile.replace("+91", ""),
        Weight: value.weight || "100",
        ShipmentLength: value.ShipmentLength || "10",
        ShipmentBreadth: value.ShipmentBreadth || "10",
        ShipmentHeight: value.ShipmentHeight || "10",
        PaymentMode: value.cod == "1" ? "cod" : "prepaid",
        PackageAmount: value.price || "5000",
        CodAmount: value.codprice,
        ProductToBeShipped: value.productName || "Artificial Jewel",
        ReturnAddress: profileData.retAddress,
        ReturnPin: profileData.rpin,
        fragileShipment: value.fragile || "false",
        SellerName: value.rname,
        SellerAddress: profileData.retAddress,
        SellerCSTNo: "",
        SellerTIN: "",
        InvoiceNo: "",
        InvoiceDate: "",
        Quantity: value.qty || "1",
        CommodityValue: value.price || "5000",
        TaxValue: value.tax || "0",
        CategoryOfGoods: value.goods || "Artificial Jewel",
        SellerGSTTIN: "",
        HSNCode: "",
        ReturnReason: "",
        VendorPickupLocation: (type == '2') ? value.pickupD : "Sujatha Fashion Jewellery",
        EWBN: "",
      });
    });
  } else if (type == "4") {
    /* XLS Head Columns */
    xlsHeader = [
      "Order ID",
      "Payment Type",
      "Pickup From",
      "Consigner Name",
      "Consigner Phone",
      "Consigner Address",
      "Consigner City",
      "Consigner State",
      "Consigner Pincode",
      "Consigner GST",
      "Consignee Name",
      "Consignee Phone",
      "Consignee Address",
      "Consignee City",
      "Consignee State",
      "Consignee Pincode",
      "Consignee GST",
      "Courier Mode",
      "Invoice Number",
      "Invoice Date",
      "EBN Number",
      "EBN Expiry",
      "Weight(gm)",
      "Length(cm)",
      "Height(cm)",
      "Breadth(cm)",
      "SKU(1)",
      "Product(1)",
      "Quantity(1)",
      "Price(1)",
      "HSN(1)",
      "SKU(2)",
      "Product(2)",
      "Quantity(2)",
      "Price(2)",
      "HSN(2)",
      "SKU(3)",
      "Product(3)",
      "Quantity(3)",
      "Price(3)",
      "HSN(3)"
    ];

    $.each(data, function (index, value) {
      xlsRows.push({
        OrderID: value.ref.replace(' ', '-') + value.mobile.slice(-5),
        PaymentType: value.cod == "1" ? "COD" : "Prepaid",
        PickupFrom: 'Consigner',
        ConsignerName: 'Sujatha one gram',
        ConsignerPhone: '8886428888',
        ConsignerAddress: 'Sujatha gold covering works Near chilkalapudi circle, Machilipatnam',
        ConsignerCity: 'Machilipatnam',
        ConsignerState: 'Andhra Pradesh',
        ConsignerPincode: '521003',
        ConsignerGST: '',
        ConsigneeName: value.name,
        ConsigneePhone: value.mobile.replace("+91", ""),
        ConsigneeAddress: value.address.replace(/\s+/g, ' ').trim(),
        ConsigneeCity: value.city,
        ConsigneeState: value.state,
        ConsigneePincode: value.pincode,
        ConsigneeGST: '',
        CourierMode: 'Surface',
        InvoiceNumber: '',
        InvoiceDate: '',
        EBNNumber: '',
        EBNExpiry: '',
        Weight: '100',
        Length: '10',
        Height: '10',
        Breadth: '10',
        SKU1: '0',
        Product1: 'Artificial Jewel',
        Quantity1: value.qty || "1",
        Price1: value.price || "5000",
        HSN1: '0',
        SKU2: '0',
        Product2: '0',
        Quantity2: '0',
        Price2: "0",
        HSN2: '0',
        SKU3: '0',
        Product5: '0',
        Quantity3: '0',
        Price3: '0',
        HSN3: '0'
      });
    });
  } else {
    console.error("Export is not available for this vendor");
    return;
  }

  createXLSLFormatObj.push(xlsHeader);
  $.each(xlsRows, function (index, value) {
    var innerRowData = [];
    $.each(value, function (ind, val) {
      innerRowData.push(val);
    });
    createXLSLFormatObj.push(innerRowData);
  });

  /* File Name */
  var filename = "SUJATHA GOLD COVERING " + new Date().getDate() + ".xls";

  if (type == '5') {
    filename = "Delhivery_New_Bulk_Order.xlsx";
  }

  if (type == '4') {
    filename = "XpressBee_Bulk_Order.csv";
  }

  /* Sheet Name */
  var ws_name = "Sheet1";

  if (typeof console !== "undefined") console.log(new Date());

  var wb = XLSX.utils.book_new(),
    ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

  var csv = XLSX.utils.sheet_to_csv(ws, { strip: true });

  if (type == '4') {
    download_file(csv, filename, 'text/csv;encoding:utf-8');
  } else {
    /* Add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    /* Write workbook and Download */
    if (typeof console !== "undefined") console.log(new Date());
    XLSX.writeFile(wb, filename);
    if (typeof console !== "undefined") console.log(new Date());
  }
}

function download_file(content, fileName, mimeType) {
  var a = document.createElement('a');
  mimeType = mimeType || 'application/octet-stream';

  if (navigator.msSaveBlob) { // IE10
    navigator.msSaveBlob(new Blob([content], {
      type: mimeType
    }), fileName);
  } else if (URL && 'download' in a) { //html5 A[download]
    a.href = URL.createObjectURL(new Blob([content], {
      type: mimeType
    }));
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
  }
}


function delhiveryApis(method, service, data, callback, target) {
  $.ajax({
    type: method,
    url: urlD + service,
    data: data,
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    dataType: "jsonp",
  }).done(function (data) {
    if (console && console.log) {
      callback(data, target);
    }
  });
}

var pinCodeData;
function pincodeCallback(data, target) {
  if (data.delivery_codes.length) {
    pinCodeData = data.delivery_codes[0].postal_code;
    pinCodeData.isInvalid = false;
  } else {
    pinCodeData = {
      isInvalid: true,
    };
  }
  // console.log(pinCodeData);
  var $ele = $(target);
  var $form = $ele.closest("form");
  // console.log(pinCodeData);
  if (pinCodeData.isInvalid) {
    $ele
      .next("span")
      .addClass("error")
      .removeClass("success")
      .text("Invalid or Unservicable Pincode");
  } else {
    $ele
      .next("span")
      .removeClass("error")
      .addClass("success")
      .text("Servicable Pincode");
  }
}